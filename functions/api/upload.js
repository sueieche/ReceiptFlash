// Cloudflare Pages Function: /api/upload
// Receives FormData (file + email + name + project + notes),
// stores in R2, sends Discord webhook notification.

export async function onRequestPost(context) {
  const { request, env } = context;

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const email = (formData.get('email') || '').toString().trim();
    const name = (formData.get('name') || '').toString().trim();
    const project = (formData.get('project') || '').toString().trim();
    const notes = (formData.get('notes') || '').toString().trim();

    if (!file || !(file instanceof File)) {
      return jsonResponse({ success: false, error: 'No file uploaded' }, 400);
    }

    if (!email) {
      return jsonResponse({ success: false, error: 'Email required' }, 400);
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
      return jsonResponse({ success: false, error: 'Invalid email' }, 400);
    }

    const allowedExts = ['.xlsx', '.xls'];
    const fileName = file.name || '';
    const ext = fileName.toLowerCase().slice(fileName.lastIndexOf('.'));
    if (!allowedExts.includes(ext)) {
      return jsonResponse({ success: false, error: 'Only .xlsx / .xls allowed' }, 400);
    }

    // Reference ID
    const ref = 'RF-' + Date.now().toString(36).toUpperCase().slice(-6);

    // Sanitize file name for storage
    const safeName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const key = `uploads/${new Date().toISOString().slice(0, 10)}/${ref}-${safeName}`;

    // Upload to R2
    let fileKey = null;
    if (env.RECEIPTS_BUCKET) {
      await env.RECEIPTS_BUCKET.put(key, file.stream(), {
        httpMetadata: {
          contentType: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
        customMetadata: {
          email,
          name,
          project,
          notes,
          originalName: fileName,
          uploadedAt: new Date().toISOString(),
          ref,
        },
      });
      fileKey = key;
    }

    // Send Discord webhook notification (fire-and-forget)
    if (env.DISCORD_WEBHOOK_URL) {
      const discordPayload = {
        embeds: [{
          title: `⚡ ReceiptFlash 新單`,
          color: 0x2e75b6,
          fields: [
            { name: '🔖 REF', value: ref, inline: true },
            { name: '📎 檔案', value: fileName, inline: true },
            { name: '📐 大小', value: formatSize(file.size), inline: true },
            { name: '📧 電郵', value: email || '（未填）', inline: false },
            { name: '👤 名字', value: name || '（未填）', inline: true },
            { name: '🎬 專案', value: project || '（未填）', inline: true },
            { name: '📝 備註', value: notes || '（無）', inline: false },
          ],
          timestamp: new Date().toISOString(),
          footer: { text: 'ReceiptFlash' },
        }],
      };
      context.waitUntil(
        fetch(env.DISCORD_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(discordPayload),
        }).catch((err) => console.error('Discord webhook failed:', err))
      );
    }

    return jsonResponse({
      success: true,
      ref,
      fileKey,
      message: 'Upload received. We will email you when the report is ready.',
    });
  } catch (err) {
    return jsonResponse({ success: false, error: String(err.message || err) }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}