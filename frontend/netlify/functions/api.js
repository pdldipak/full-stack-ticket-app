const DEFAULT_BACKEND_ORIGIN = 'http://161.35.200.119';

function getBackendOrigin() {
  return (process.env.BACKEND_ORIGIN || DEFAULT_BACKEND_ORIGIN).replace(/\/+$/, '');
}

function getForwardPath(event) {
  const prefix = '/.netlify/functions/api';
  const path = event.path || '/';
  return path.startsWith(prefix) ? path.slice(prefix.length) || '/' : path;
}

function pickRequestHeaders(headers = {}) {
  const allowList = new Set([
    'accept',
    'accept-language',
    'content-type',
    'authorization',
  ]);

  const out = {};
  for (const [k, v] of Object.entries(headers)) {
    const key = String(k).toLowerCase();
    if (allowList.has(key) && v != null) out[key] = v;
  }
  return out;
}

exports.handler = async (event) => {
  const backendOrigin = getBackendOrigin();
  const forwardPath = getForwardPath(event);
  const qs = event.rawQueryString ? `?${event.rawQueryString}` : '';
  const url = `${backendOrigin}${forwardPath}${qs}`;

  const method = event.httpMethod || 'GET';
  const headers = pickRequestHeaders(event.headers);
  const body =
    event.body && event.isBase64Encoded
      ? Buffer.from(event.body, 'base64')
      : event.body || undefined;

  const res = await fetch(url, {
    method,
    headers,
    body: method === 'GET' || method === 'HEAD' ? undefined : body,
  });

  const contentType = res.headers.get('content-type') || 'application/octet-stream';
  const text = await res.text();

  return {
    statusCode: res.status,
    headers: {
      'content-type': contentType,
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'authorization, content-type, accept',
      'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'cache-control': 'no-store',
    },
    body: text,
  };
};
