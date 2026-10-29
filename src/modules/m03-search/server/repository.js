import 'server-only';
import { getSupabaseAdmin } from '@/server/db/supabase.js';
import { fromSupabaseError } from '@/server/http/errors.js';

/** Bảng M03 sở hữu (xem README để biết quy ước dùng chung). */
export const OWNED_TABLES = Object.freeze(['search_history']);

const PAGE_SIZE = 1000;

const table = (name) => getSupabaseAdmin().from(name);

async function listAllRows(buildQuery) {
  const rows = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await buildQuery().range(from, from + PAGE_SIZE - 1);
    if (error) throw fromSupabaseError(error);

    const batch = data ?? [];
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) return rows;
  }
}

function applyDateRange(query, { since, until } = {}) {
  let next = query;
  if (since) next = next.gte('created_at', since);
  if (until) next = next.lte('created_at', until);
  return next;
}

/**
 * M03-F11 — ghi một lượt tìm kiếm.
 * @param {{ user_id: string | null, guest_session_id: string | null, keyword: string, normalized_keyword: string, result_count: number }} data
 */
export async function insertSearchHistory(data) {
  const { data: row, error } = await table('search_history')
    .insert(data)
    .select('id,created_at')
    .single();

  if (error) throw fromSupabaseError(error);
  return row;
}

/**
 * M03-F12 — lịch sử tìm kiếm theo khoảng ngày (mới nhất trước).
 */
export async function listSearchHistoryRows({ since, until } = {}) {
  return listAllRows(() =>
    applyDateRange(
      table('search_history')
        .select('keyword,normalized_keyword,result_count,created_at')
        .order('created_at', { ascending: false }),
      { since, until },
    ),
  );
}

/**
 * M03-F12 — tổng số lượt tìm trong khoảng ngày.
 */
export async function countSearchRows({ since, until } = {}) {
  const { count, error } = await applyDateRange(
    table('search_history').select('id', { count: 'exact', head: true }),
    { since, until },
  );

  if (error) throw fromSupabaseError(error);
  return count ?? 0;
}
