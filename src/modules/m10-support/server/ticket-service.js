import 'server-only';
import { buildPaginationMeta } from '@/server/http/pagination.js';
import { getCustomerDisplayName, getUserContact } from '@/modules/m01-account/public.server.js';
import { isOrderOwnedByUser } from '@/modules/m05-checkout/public.server.js';
import {
  CUSTOMER_REPLYABLE_STATUSES,
  DEFAULT_LIST_LIMIT,
  REVIEW_STATUSES,
  TICKET_AUTO_CLOSE_HOURS,
  TICKET_SENDERS,
  TICKET_SLA_RESPONSE_HOURS,
  TICKET_STATUSES,
  TICKET_TRANSITIONS,
} from './constants.js';
import {
  conflict,
  forbidden,
  isStaffRole,
  normalizeMedia,
  notFound,
  toNumber,
} from './helpers.js';
import * as repo from './repository.js';

/**
 * [SERVER] M10 — nghiệp vụ ticket hỗ trợ và dashboard CSKH.
 * SRS: TOY-M10 (M10-F06..F08, F11, BR-M10-04, NFR-M10-02).
 */

/* ------------------------------------------------------------------ */
/* DTO                                                                 */
/* ------------------------------------------------------------------ */

function mapTicket(row, { customerName = null, assigneeName = null } = {}) {
  if (!row) return null;
  return {
    ticket_id: row.id,
    ticket_code: row.ticket_code,
    subject: row.subject,
    category: row.category,
    priority: row.priority,
    status: row.status,
    user_id: row.user_id ?? null,
    customer_name: customerName,
    assigned_to: row.assigned_to ?? null,
    assignee_name: assigneeName,
    order_id: row.order_id ?? null,
    resolved_at: row.resolved_at ?? null,
    closed_at: row.closed_at ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapMessage(row, attachments = []) {
  return {
    message_id: row.id,
    sender_type: row.sender_type,
    sender_id: row.sender_id ?? null,
    content: row.content,
    attachments: attachments.map((item) => ({
      id: item.id,
      media_type: item.media_type,
      url: item.file_url,
    })),
    created_at: row.created_at,
  };
}

async function loadConversation(ticketId) {
  const messages = await repo.listTicketMessages(ticketId);
  const attachments = await repo.listTicketAttachments(messages.map((row) => row.id));

  const byMessage = new Map();
  for (const item of attachments) {
    if (!byMessage.has(item.message_id)) byMessage.set(item.message_id, []);
    byMessage.get(item.message_id).push(item);
  }

  return messages.map((row) => mapMessage(row, byMessage.get(row.id) ?? []));
}

async function attachAttachments(messageId, urls = []) {
  if (!urls.length) return [];
  const rows = normalizeMedia(urls).map(({ media_type, url, file_size_bytes }) => ({
    media_type,
    file_url: url,
    file_size_bytes,
  }));
  return repo.createTicketAttachments(messageId, rows);
}

async function resolveCustomerName(userId) {
  if (!userId) return 'Khách vãng lai';
  return getCustomerDisplayName(userId);
}

function assertTransition(currentStatus, nextStatus) {
  const allowed = TICKET_TRANSITIONS[currentStatus] ?? [];
  if (!allowed.includes(nextStatus)) {
    throw conflict(`Không thể chuyển ticket từ ${currentStatus} sang ${nextStatus}.`);
  }
}

/* ------------------------------------------------------------------ */
/* M10-F06 — Tạo ticket                                                */
/* ------------------------------------------------------------------ */

export async function createSupportTicket({ auth, body }) {
  const userId = auth?.userId;
  if (!userId) throw forbidden('Vui lòng đăng nhập để gửi yêu cầu hỗ trợ.');

  if (body.order_id) {
    const owned = await isOrderOwnedByUser(body.order_id, userId);
    if (!owned) throw forbidden('Đơn hàng không thuộc tài khoản của bạn.');
  }

  const ticket = await repo.insertSupportTicket({
    user_id: userId,
    order_id: body.order_id ?? null,
    subject: body.subject.trim(),
    category: body.category,
    priority: 'NORMAL',
    status: TICKET_STATUSES.OPEN,
  });

  try {
    const message = await repo.insertTicketMessage({
      ticket_id: ticket.id,
      sender_type: TICKET_SENDERS.CUSTOMER,
      sender_id: userId,
      content: body.message.trim(),
    });
    await attachAttachments(message.id, body.files ?? []);
  } catch (error) {
    // Bù trừ: ticket không có tin nhắn đầu tiên thì không được tồn tại.
    await repo.deleteSupportTicketRow(ticket.id).catch(() => null);
    throw error;
  }

  return {
    ticket_id: ticket.id,
    ticket_code: ticket.ticket_code,
    status: ticket.status,
    priority: ticket.priority,
    created_at: ticket.created_at,
    message: `Đã tạo yêu cầu ${ticket.ticket_code}. KAIDO phản hồi trong ${TICKET_SLA_RESPONSE_HOURS} giờ làm việc.`,
  };
}

/* ------------------------------------------------------------------ */
/* M10-F07 — Theo dõi tiến trình yêu cầu                               */
/* ------------------------------------------------------------------ */

export async function listMySupportTickets({ auth, query }) {
  const userId = auth?.userId;
  if (!userId) throw forbidden('Vui lòng đăng nhập để xem yêu cầu hỗ trợ.');

  const { page = 1, limit = DEFAULT_LIST_LIMIT } = query ?? {};
  const offset = (page - 1) * limit;

  const { rows, total } = await repo.listSupportTicketsByUser(userId, {
    status: query?.status ?? null,
    limit,
    offset,
  });

  return {
    items: rows.map((row) => mapTicket(row)),
    ...buildPaginationMeta({ page, limit, total }),
  };
}

export async function getSupportTicket({ auth, ticketRef }) {
  const ticket = await repo.findSupportTicketByRef(ticketRef);
  if (!ticket) throw notFound('Không tìm thấy yêu cầu hỗ trợ.');

  const isOwner = ticket.user_id && ticket.user_id === auth?.userId;
  if (!isOwner && !isStaffRole(auth?.role)) {
    throw forbidden('Bạn chỉ xem được yêu cầu hỗ trợ của chính mình (NFR-M10-02).');
  }

  const conversation = await loadConversation(ticket.id);
  const customerName = isOwner
    ? await getCustomerDisplayName(ticket.user_id)
    : await resolveCustomerName(ticket.user_id);

  return {
    ticket: mapTicket(ticket, { customerName }),
    conversation_messages: conversation,
    can_reply: isOwner && CUSTOMER_REPLYABLE_STATUSES.includes(ticket.status),
  };
}

export async function replySupportTicket({ auth, ticketRef, body }) {
  const ticket = await repo.findSupportTicketByRef(ticketRef);
  if (!ticket) throw notFound('Không tìm thấy yêu cầu hỗ trợ.');

  if (!ticket.user_id || ticket.user_id !== auth?.userId) {
    throw forbidden('Chỉ khách tạo yêu cầu mới được phản hồi tại đây.');
  }
  if (ticket.status === TICKET_STATUSES.CLOSED) {
    throw conflict('Yêu cầu đã đóng. Vui lòng tạo yêu cầu mới nếu cần hỗ trợ tiếp.');
  }

  const message = await repo.insertTicketMessage({
    ticket_id: ticket.id,
    sender_type: TICKET_SENDERS.CUSTOMER,
    sender_id: auth.userId,
    content: body.message.trim(),
  });
  await attachAttachments(message.id, body.files ?? []);

  // M10-F07 — khách phản hồi lại ticket đã RESOLVED thì mở lại để CSKH tiếp tục.
  let updated = ticket;
  let reopened = false;
  if (ticket.status === TICKET_STATUSES.RESOLVED) {
    updated = await repo.updateSupportTicketRow(ticket.id, {
      status: TICKET_STATUSES.IN_PROGRESS,
      resolved_at: null,
    });
    reopened = true;
  }

  return {
    message: mapMessage(message, await repo.listTicketAttachments([message.id])),
    ticket_status: updated?.status ?? ticket.status,
    reopened,
  };
}

/* ------------------------------------------------------------------ */
/* M10-F08 — Tiếp nhận & xử lý ticket (STAFF/ADMIN)                    */
/* ------------------------------------------------------------------ */

export async function listAdminSupportTickets({ query }) {
  const { page = 1, limit = DEFAULT_LIST_LIMIT } = query ?? {};
  const offset = (page - 1) * limit;

  const { rows, total } = await repo.listAdminSupportTickets({
    status: query?.status ?? null,
    category: query?.category ?? null,
    priority: query?.priority ?? null,
    assignedTo: query?.assigned_to ?? null,
    keyword: query?.keyword ?? null,
    limit,
    offset,
  });

  const items = await Promise.all(
    rows.map(async (row) => {
      const [customerName, assignee] = await Promise.all([
        resolveCustomerName(row.user_id),
        row.assigned_to ? getUserContact(row.assigned_to) : Promise.resolve(null),
      ]);
      return mapTicket(row, {
        customerName,
        assigneeName: assignee?.full_name ?? null,
      });
    }),
  );

  return { items, ...buildPaginationMeta({ page, limit, total }) };
}

export async function getAdminSupportTicket({ auth, id }) {
  const ticket = await repo.findSupportTicketById(id);
  if (!ticket) throw notFound('Không tìm thấy yêu cầu hỗ trợ.');

  const [conversation, customer, assignee] = await Promise.all([
    loadConversation(ticket.id),
    getUserContact(ticket.user_id),
    ticket.assigned_to ? getUserContact(ticket.assigned_to) : Promise.resolve(null),
  ]);

  return {
    ticket: mapTicket(ticket, {
      customerName: customer?.full_name ?? (await resolveCustomerName(ticket.user_id)),
      assigneeName: assignee?.full_name ?? null,
    }),
    customer,
    conversation_messages: conversation,
    allowed_statuses: TICKET_TRANSITIONS[ticket.status] ?? [],
    handled_by: auth?.userId ?? null,
  };
}

export async function processSupportTicket({ auth, id, body }) {
  const ticket = await repo.findSupportTicketById(id);
  if (!ticket) throw notFound('Không tìm thấy yêu cầu hỗ trợ.');

  const patch = {};
  let postedMessage = null;

  if (body.action === 'ASSIGN') {
    const assignee = await getUserContact(body.assigned_to);
    if (!assignee) throw notFound('Không tìm thấy nhân viên được phân công.');

    patch.assigned_to = body.assigned_to;
    if (body.priority) patch.priority = body.priority;
    if (ticket.status === TICKET_STATUSES.OPEN) patch.status = TICKET_STATUSES.IN_PROGRESS;
  }

  if (body.priority && body.action !== 'ASSIGN') patch.priority = body.priority;

  if (body.action === 'REPLY') {
    postedMessage = await repo.insertTicketMessage({
      ticket_id: ticket.id,
      sender_type: TICKET_SENDERS.STAFF,
      sender_id: auth?.userId ?? null,
      content: body.message.trim(),
    });
    await attachAttachments(postedMessage.id, body.files ?? []);

    if (ticket.status === TICKET_STATUSES.OPEN) patch.status = TICKET_STATUSES.IN_PROGRESS;
  }

  if (body.action === 'RESOLVE') {
    assertTransition(ticket.status, TICKET_STATUSES.RESOLVED);
    patch.status = TICKET_STATUSES.RESOLVED;
    patch.resolved_at = new Date().toISOString();
  }

  if (body.action === 'CLOSE') {
    assertTransition(ticket.status, TICKET_STATUSES.CLOSED);
    patch.status = TICKET_STATUSES.CLOSED;
    patch.closed_at = new Date().toISOString();
  }

  if (body.action === 'REOPEN') {
    assertTransition(ticket.status, TICKET_STATUSES.IN_PROGRESS);
    patch.status = TICKET_STATUSES.IN_PROGRESS;
    patch.resolved_at = null;
    patch.closed_at = null;
  }

  const updated = await repo.updateSupportTicketRow(ticket.id, patch);
  if (!updated) throw notFound('Không tìm thấy yêu cầu hỗ trợ.');

  if (body.action === 'RESOLVE' || body.action === 'CLOSE') {
    await repo.insertTicketMessage({
      ticket_id: ticket.id,
      sender_type: TICKET_SENDERS.SYSTEM,
      sender_id: null,
      content:
        body.note?.trim() ||
        (body.action === 'RESOLVE'
          ? 'CSKH đã giải quyết yêu cầu. Khách có thể phản hồi trong thời gian lưu trữ.'
          : 'CSKH đã đóng yêu cầu hỗ trợ.'),
    });
  }

  const [customerName, assignee] = await Promise.all([
    resolveCustomerName(updated.user_id),
    updated.assigned_to ? getUserContact(updated.assigned_to) : Promise.resolve(null),
  ]);

  return {
    ticket: mapTicket(updated, {
      customerName,
      assigneeName: assignee?.full_name ?? null,
    }),
    message: postedMessage
      ? mapMessage(postedMessage, await repo.listTicketAttachments([postedMessage.id]))
      : null,
  };
}

/* ------------------------------------------------------------------ */
/* BR-M10-04 — Cron tự đóng ticket RESOLVED quá 72 giờ                 */
/* ------------------------------------------------------------------ */

function isMissingRpc(error) {
  const code = String(error?.cause?.code ?? error?.code ?? '');
  if (code === 'PGRST202' || code === '42883') return true;
  const message = String(error?.cause?.message ?? error?.message ?? '');
  return /schema cache|does not exist|not find the function/i.test(message);
}

export async function closeResolvedTickets({ hours = TICKET_AUTO_CLOSE_HOURS } = {}) {
  try {
    const result = await repo.closeResolvedTicketsRpc(hours);
    return {
      closed_count: toNumber(result?.closed_count),
      threshold_hours: toNumber(result?.threshold_hours) || hours,
      ran_at: result?.ran_at ?? new Date().toISOString(),
      mode: 'rpc',
    };
  } catch (error) {
    if (!isMissingRpc(error)) throw error;
  }

  // Dự phòng khi migration 006 chưa chạy: xử lý tuần tự, idempotent.
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const candidates = await repo.listResolvedTicketsOlderThan(cutoff);
  let closed = 0;

  for (const ticket of candidates) {
    const latestCustomer = await repo.findLatestCustomerMessage(ticket.id);
    const resolvedAt = Date.parse(ticket.resolved_at ?? '');
    const customerAt = latestCustomer ? Date.parse(latestCustomer.created_at ?? '') : 0;
    if (Number.isFinite(resolvedAt) && customerAt > resolvedAt) continue;

    const updated = await repo.updateSupportTicketRow(ticket.id, {
      status: TICKET_STATUSES.CLOSED,
      closed_at: new Date().toISOString(),
    });
    if (!updated) continue;

    await repo.insertTicketMessage({
      ticket_id: ticket.id,
      sender_type: TICKET_SENDERS.SYSTEM,
      sender_id: null,
      content: `Hệ thống tự động đóng yêu cầu sau ${hours} giờ kể từ khi được giải quyết (BR-M10-04).`,
    });
    closed += 1;
  }

  return {
    closed_count: closed,
    threshold_hours: hours,
    ran_at: new Date().toISOString(),
    mode: 'fallback',
  };
}

/* ------------------------------------------------------------------ */
/* M10-F11 — Dashboard CSKH                                            */
/* ------------------------------------------------------------------ */

export async function getSupportDashboard() {
  const slaCutoff = new Date(Date.now() - TICKET_SLA_RESPONSE_HOURS * 60 * 60 * 1000).toISOString();

  const [
    open,
    inProgress,
    resolved,
    closed,
    overdue,
    pendingReviews,
    approvedReviews,
    hiddenReviews,
    activeFaqs,
  ] = await Promise.all([
    repo.countTicketsByStatus(TICKET_STATUSES.OPEN),
    repo.countTicketsByStatus(TICKET_STATUSES.IN_PROGRESS),
    repo.countTicketsByStatus(TICKET_STATUSES.RESOLVED),
    repo.countTicketsByStatus(TICKET_STATUSES.CLOSED),
    repo.countOverdueTickets(slaCutoff),
    repo.countReviewsByStatus(REVIEW_STATUSES.PENDING),
    repo.countReviewsByStatus(REVIEW_STATUSES.APPROVED),
    repo.countReviewsByStatus(REVIEW_STATUSES.HIDDEN),
    repo.countActiveFaqs(),
  ]);

  return {
    generated_at: new Date().toISOString(),
    sla_response_hours: TICKET_SLA_RESPONSE_HOURS,
    tickets: {
      open,
      in_progress: inProgress,
      resolved,
      closed,
      total: open + inProgress + resolved + closed,
      overdue_sla: overdue,
    },
    reviews: {
      pending: pendingReviews,
      approved: approvedReviews,
      hidden: hiddenReviews,
      total: pendingReviews + approvedReviews + hiddenReviews,
    },
    faqs: { active: activeFaqs },
  };
}

/** Dùng nội bộ cho kiểm thử/hợp đồng public.server.js. */
export { mapTicket as mapTicketDto };
