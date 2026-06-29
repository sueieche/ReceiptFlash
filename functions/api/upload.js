// Cloudflare Pages Function: /api/upload
// Receives FormData (file + email + name + project + notes),
// stores in R2. Supports .xlsx, .xls, .zip (zip may contain xlsx + photos/).

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

    const allowedExts = ['.xlsx', '.xls', '.zip'];
    const fileName = file.name || '';
    const ext = fileName.toLowerCase().slice(fileName.lastIndexOf('.'));
    if (!allowedExts.includes(ext)) {
      return jsonResponse({ success: false, error: 'Only .xlsx / .xls / .zip allowed' }, 400);
    }

    // Reference ID
    const ref = 'RF-' + Date.now().toString(36).toUpperCase().slice(-6);
    const dateStr = new Date().toISOString().slice(0, 10);
    const safeFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const basePrefix = `uploads/${dateStr}/${ref}`;

    let storedFiles = [];
    let isZip = false;

    if (ext === '.zip') {
      isZip = true;
      // Try to unzip and store contents
      try {
        const zipData = new Uint8Array(await file.arrayBuffer());
        // Use a simple zip library or built-in DecompressionStream if available
        // Cloudflare Workers/Pages have DecompressionStream for raw deflate but not zip
        // So we store the zip as-is and let the pipeline unzip later
        if (env.RECEIPTS_BUCKET) {
          await env.RECEIPTS_BUCKET.put(`${basePrefix}/${safeFileName}`, file.stream(), {
            httpMetadata: {
              contentType: 'application/zip',
            },
            customMetadata: {
              email, name, project, notes, originalName: fileName, uploadedAt: new Date().toISOString(), ref, isZip: 'true',
            },
          });
          storedFiles.push(`${basePrefix}/${safeFileName}`);
        }
      } catch (err) {
        return jsonResponse({ success: false, error: 'Failed to process zip: ' + err.message }, 400);
      }
    } else {
      // Single Excel file
      const safeName = safeFileName;
      const key = `${basePrefix}/${safeName}`;
      if (env.RECEIPTS_BUCKET) {
        await env.RECEIPTS_BUCKET.put(key, file.stream(), {
          httpMetadata: {
            contentType: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          },
          customMetadata: {
            email, name, project, notes, originalName: fileName, uploadedAt: new Date().toISOString(), ref, isZip: 'false',
          },
        });
        storedFiles.push(key);
      }
    }

    // Send Discord webhook notification
    if (env.DISCORD_WEBHOOK_URL) {
      const discordPayload = {
        embeds: [{
          title: `⚡ ReceiptFlash 新單`,
          color: 0xD4FF00,
          fields: [
            { name: '🔖 REF', value: ref, inline: true },
            { name: '📎 檔案', value: fileName, inline: true },
            { name: '📐 大小', value: formatSize(file.size), inline: true },
            { name: '📦 類型', value: isZip ? 'ZIP (多檔打包)' : 'Excel', inline: true },
            { name: '📧 電郵', value: email || '（未填）', inline: false },
            { name: '👤 名字', value: name || '（未填）', inline: true },
            { name: '🎬 專案', value: project || '（未填）', inline: true },
            { name: '📝 備註', value: notes || '（無）', inline: false },
            { name: '☁️ R2 路徑', value: storedFiles.join('\n') || '(not stored)', inline: false },
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
      isZip,
      storedFiles,
      message: isZip
        ? 'Zip uploaded. We will extract Excel + photos and email you the report.'
        : 'Upload received. We will email you when the report is ready.',
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