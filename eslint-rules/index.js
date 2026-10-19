import path from 'node:path';

const SERVER_CONTEXT = [
  /\/src\/server\//,
  /\/src\/modules\/[^/]+\/server\//,
  /\/src\/modules\/[^/]+\/public\.server\.js$/,
  /\/src\/app\/api\//,
  /\/scripts\//,
];

const CLIENT_CONTEXT = [
  /\/src\/modules\/[^/]+\/client\//,
  /\/src\/modules\/[^/]+\/public\.client\.js$/,
  /\/src\/shared\//,
];

function normalize(filename) {
  return filename.split(path.sep).join('/');
}

function isServerContext(filename) {
  const file = normalize(filename);
  return SERVER_CONTEXT.some((pattern) => pattern.test(file));
}

function isClientContext(filename) {
  const file = normalize(filename);
  return CLIENT_CONTEXT.some((pattern) => pattern.test(file));
}

function resolvedSpecifier(filename, specifier) {
  if (specifier.startsWith('.')) {
    return normalize(path.resolve(path.dirname(filename), specifier));
  }
  if (specifier.startsWith('@/')) {
    return normalize(path.resolve(process.cwd(), 'src', specifier.slice(2)));
  }
  return normalize(specifier);
}

function moduleOf(filename) {
  const match = normalize(filename).match(/\/src\/modules\/([^/]+)\//);
  return match ? match[1] : null;
}

const plugin = {
  rules: {
    'no-client-server-imports': {
      meta: {
        type: 'problem',
        docs: { description: 'Không import src/server/** từ client hoặc shared code' },
        schema: [],
        messages: {
          serverImport:
            'Không được import "{{source}}" từ client/shared. Mọi truy cập server phải đi qua API (src/app/api) hoặc public.server.js của module.',
        },
      },
      create(context) {
        const filename = context.filename;
        if (isServerContext(filename) || !isClientContext(filename)) return {};
        return {
          ImportDeclaration(node) {
            const source = node.source.value;
            const resolved = resolvedSpecifier(filename, source);
            if (
              source === '@/server' ||
              source.startsWith('@/server/') ||
              resolved.includes('/src/server/')
            ) {
              context.report({ node, messageId: 'serverImport', data: { source } });
            }
          },
          ExportNamedDeclaration(node) {
            if (!node.source) return;
            const source = node.source.value;
            const resolved = resolvedSpecifier(filename, source);
            if (
              source === '@/server' ||
              source.startsWith('@/server/') ||
              resolved.includes('/src/server/')
            ) {
              context.report({ node, messageId: 'serverImport', data: { source } });
            }
          },
        };
      },
    },
    'no-deep-cross-module-imports': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Module chỉ được import module khác qua public.server.js / public.client.js',
        },
        schema: [],
        messages: {
          deepImport:
            'Không import sâu vào module khác ("{{source}}"). Dùng public.server.js hoặc public.client.js của module đó.',
          serverPublicFromClient:
            'Client không được import public.server.js ("{{source}}"). Chỉ dùng public.client.js hoặc gọi API.',
        },
      },
      create(context) {
        const filename = normalize(context.filename);
        if (filename.includes('/src/app/') || filename.includes('/scripts/')) return {};
        const currentModule = moduleOf(filename);
        const clientFile = isClientContext(filename);

        function check(node, source) {
          const resolved = resolvedSpecifier(filename, source);
          const targetModule = resolved.match(/\/src\/modules\/([^/]+)\//)?.[1];
          if (!targetModule) return;
          const isPublicServer = /\/src\/modules\/[^/]+\/public\.server(\.js)?$/.test(resolved);
          const isPublicClient = /\/src\/modules\/[^/]+\/public\.client(\.js)?$/.test(resolved);

          if (clientFile && isPublicServer) {
            context.report({ node, messageId: 'serverPublicFromClient', data: { source } });
            return;
          }
          if (!isPublicServer && !isPublicClient) {
            const targetFile = normalize(resolved);
            const deep =
              /\/(server|client)\//.test(targetFile) || targetFile.endsWith('/public.server.js');
            if (deep && targetModule !== currentModule) {
              context.report({ node, messageId: 'deepImport', data: { source } });
            }
          }
        }

        return {
          ImportDeclaration(node) {
            check(node, node.source.value);
          },
          ExportNamedDeclaration(node) {
            if (node.source) check(node, node.source.value);
          },
          ExportAllDeclaration(node) {
            check(node, node.source.value);
          },
        };
      },
    },
  },
};

export default plugin;
