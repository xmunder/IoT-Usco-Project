import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../../', import.meta.url));
const host = '127.0.0.1';
const port = Number(process.env.PORT ?? 4173);

const CONTENT_TYPES = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.js', 'application/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.mjs', 'application/javascript; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml; charset=utf-8'],
  ['.txt', 'text/plain; charset=utf-8']
]);

function resolveRequestPath(requestPath) {
  const normalizedPath = requestPath === '/' ? '/main/public/index.html' : decodeURIComponent(requestPath);
  const candidatePath = path.resolve(projectRoot, `.${normalizedPath}`);

  if (!candidatePath.startsWith(projectRoot)) {
    return null;
  }

  return candidatePath;
}

async function getFilePath(candidatePath) {
  const candidateStat = await stat(candidatePath);
  if (candidateStat.isDirectory()) {
    return path.join(candidatePath, 'index.html');
  }

  return candidatePath;
}

function send(response, statusCode, body, headers = {}) {
  response.writeHead(statusCode, {
    'Cache-Control': 'no-store',
    ...headers
  });
  response.end(body);
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? `${host}:${port}`}`);

  if (url.pathname === '/health') {
    send(response, 200, 'ok', { 'Content-Type': 'text/plain; charset=utf-8' });
    return;
  }

  const candidatePath = resolveRequestPath(url.pathname);
  if (!candidatePath) {
    send(response, 403, 'Forbidden', { 'Content-Type': 'text/plain; charset=utf-8' });
    return;
  }

  try {
    const filePath = await getFilePath(candidatePath);
    const body = await readFile(filePath);
    const contentType = CONTENT_TYPES.get(path.extname(filePath).toLowerCase()) ?? 'application/octet-stream';

    send(response, 200, body, { 'Content-Type': contentType });
  } catch (error) {
    if (error?.code === 'ENOENT') {
      send(response, 404, 'Not Found', { 'Content-Type': 'text/plain; charset=utf-8' });
      return;
    }

    send(response, 500, 'Internal Server Error', { 'Content-Type': 'text/plain; charset=utf-8' });
  }
});

server.listen(port, host, () => {
  console.log(`Playwright static server listening on http://${host}:${port}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
