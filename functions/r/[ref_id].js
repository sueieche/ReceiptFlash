// Cloudflare Pages Function: /r/:ref_id
// Serves the rendered HTML report from R2 (reports/{ref_id}/index.html).
// The report is uploaded by ~/ai-scripts/receiptflash_pipeline.py after
// processing a ReceiptFlash upload.

const REF_ID_RE = /^RF-[A-Z0-9-]{4,16}$/;

export async function onRequestGet(context) {
  const { env, params, request } = context;
  const refId = params.ref_id;

  // Defensive validation — refuse anything that isn't an RF-* id
  if (!REF_ID_RE.test(refId)) {
    return new Response('Bad ref_id', { status: 400 });
  }

  if (!env.RECEIPTS_BUCKET) {
    return new Response('R2 binding missing', { status: 500 });
  }

  let obj;
  try {
    obj = await env.RECEIPTS_BUCKET.get(`reports/${refId}/index.html`);
  } catch (e) {
    return new Response('R2 fetch error: ' + e.message, { status: 502 });
  }

  if (!obj) {
    // 404 — point users back to the homepage so they can re-upload
    return Response.redirect('https://receiptflash.com/?missing=' + refId, 302);
  }

  const html = await obj.text();
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // ReceiptFlash erases report after 30 days per the email CTA;
      // cache modestly so repeat visits stay fast.
      'Cache-Control': 'public, max-age=300',
      'X-Receipt-Ref': refId,
    },
  });
}

// Disallow POST/PUT/etc. so the route is read-only.
export async function onRequestPost() {
  return new Response('Method not allowed', {
    status: 405,
    headers: { Allow: 'GET' },
  });
}
