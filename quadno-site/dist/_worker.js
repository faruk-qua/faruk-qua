// Cloudflare Pages advanced mode. Set the three bindings in the Pages dashboard.
const RECIPIENT = 'admin@quadno.com';
const SENDER = 'form@bildirim.quadno.com';
const PRODUCTS = new Map([
  ['general', 'Genel bilgi'], ['designer', 'QUBI Designer'], ['viewer', 'QUBI Viewer'],
  ['doorlock', 'Doorlock'], ['ai', 'QUBI AI']
]);
const MAX_BYTES = 24000;
function json(data, status = 200, extra = {}) {
  return Response.json(data, {status, headers: {'Cache-Control': 'no-store', ...extra}});
}
function configured(env) {
  return Boolean(env.RESEND_API_KEY && env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET_KEY);
}
async function readPayload(request) {
  if (Number(request.headers.get('content-length')) > MAX_BYTES || !request.body) return null;
  const reader = request.body.getReader();
  const decoder = new TextDecoder('utf-8', {fatal: true});
  let text = '', size = 0;
  try {
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > MAX_BYTES) { await reader.cancel(); return null; }
      text += decoder.decode(chunk.value, {stream: true});
    }
    const data = JSON.parse(text + decoder.decode());
    return data && typeof data === 'object' && !Array.isArray(data) ? data : null;
  } catch { return null; }
}
function validFields(data) {
  if (!data || !['name', 'email', 'product', 'message', 'token'].every(k => typeof data[k] === 'string')) return false;
  const {name, email, message, product, token} = data;
  return name.trim().length > 0 && name.length <= 100 && !/[\x00-\x1f\x7f]/.test(name)
    && email.length <= 254 && /^[^\s@,;<>\x00-\x1f\x7f]+@[^\s@,;<>\x00-\x1f\x7f]+\.[^\s@,;<>\x00-\x1f\x7f]+$/u.test(email)
    && PRODUCTS.has(product) && message.trim().length > 0 && message.length <= 3000
    && token.length > 0 && token.length <= 2048;
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/api/contact') return env.ASSETS.fetch(request);
    if (request.method === 'GET') return json({siteKey: configured(env) ? env.TURNSTILE_SITE_KEY : null});
    if (request.method !== 'POST') return json({error:'method'}, 405, {Allow:'GET, POST'});
    if (request.headers.get('origin') !== url.origin) return json({error:'origin'}, 403);
    if (!configured(env)) return json({error:'unconfigured'}, 503);
    if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') return json({error:'type'}, 415);
    const data = await readPayload(request);
    if (!validFields(data)) return json({error:'fields'}, 400);
    const verification = new FormData();
    verification.set('secret', env.TURNSTILE_SECRET_KEY);
    verification.set('response', data.token);
    try {
      const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method:'POST', body:verification, signal:AbortSignal.timeout(10000)
      });
      if (!response.ok) return json({error:'challenge_unavailable'}, 503);
      const check = await response.json();
      if (!check.success || check.hostname !== url.hostname || check.action !== 'contact')
        return json({error:'challenge'}, 403);
    } catch { return json({error:'challenge_unavailable'}, 503); }

    const product = PRODUCTS.get(data.product);
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method:'POST', headers:{Authorization:'Bearer '+env.RESEND_API_KEY, 'Content-Type':'application/json'},
        signal:AbortSignal.timeout(15000),
        body:JSON.stringify({
          from:SENDER, to:[RECIPIENT], reply_to:data.email, subject:'Quadno web | '+product,
          text:['Ad soyad: '+data.name.trim(), 'E-posta: '+data.email, 'Ürün: '+product, '', data.message.trim()].join('\n')
        })
      });
      const payload = await response.json();
      if (!response.ok || typeof payload?.id !== 'string' || !payload.id.trim())
        return json({error:'delivery'}, 502);
      return json({accepted:true}, 202);
    } catch { return json({error:'delivery'}, 502); }
  }
};
