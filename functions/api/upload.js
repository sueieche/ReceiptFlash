// Cloudflare Pages Function: /api/upload
// Receives FormData (file + email + name + project + notes),
// stores in R2 stub, sends Discord webhook notification.

export async function onRequestPost(context) {
  const { request, env } = context;

  // CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const email = formData.get('email') || '';
    const name = formData.get('name') || '';
    const project = formData.get('project') || '';
    const notes = formData.get('notes') || '';

    if (!file || !(file instanceof File)) {
      return jsonResponse({ success: false, error: 'No file uploaded' }, 400);
    }

    if (!email) {
      return jsonResponse({ success: false, error: 'Email required' }, 400);
    }

    // Validate file type
    const allowedExts = ['.xlsx', '.xls'];
    const fileName = file.name || '';
    const ext = fileName.toLowerCase().slice(fileName.lastIndexOf('.'));
    if (!allowedExts.includes(ext)) {
      return jsonResponse({ success: false, error: 'Only .xlsx / .xls allowed' }, 400);
    }

    // Generate reference ID
    const ref = 'RF-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();

    // Upload to R2 if bound
    if (env.RECEIPTS_BUCKET) {
      const key = `${new Date().toISOString().slice(0, 10)}/${ref}/${fileName}`;
      await env.RECEIPTS_BUCKET.put(key, file.stream(), {
        httpMetadata: { contentType: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
        customMetadata: { email, name, project, notes, ref }
      });
    }

    // Send Discord notification if webhook bound
    if (env.DISCORD_WEBHOOK_URL) {
      const discordPayload = {
        embeds: [{
          title: `📥 New upload: ${ref}`,
          color: 0x2e75b6,
          fields: [
            { name: 'Email', value: email, inline: true },
            { name: 'Name', value: name || '—', inline: true },
            { name: 'Project', value: project || '—', inline: true },
            { name: 'File', value: fileName, inline: false },
            { name: 'Size', value: formatSize(file.size), inline: true },
            { name: 'Notes', value: notes || '—', inline: false }
          ],
          timestamp: new Date().toISOString()
        }]
      };
      // Fire-and-forget
      context.waitUntil(
        fetch(env.DISCORD_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(discordPayload)
        }).catch(() => {})
      );
    }

    return jsonResponse({
      success: true,
      ref,
      message: 'Upload received. We will email you when the report is ready.'
    });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
