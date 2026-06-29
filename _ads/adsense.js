// ===== AdSense 注入 =====
// 用法: <div class="ad-slot" data-ad="header-banner"></div>

(function() {
  const AD_SLOTS = {
    'header-banner': { slot: '7968953494', format: 'horizontal' },
    'side-rectangle': { slot: '7227138923', format: 'rectangle' },
    'in-article-blog': { slot: '5914057257', layout: 'in-article' }
  };

  function adHTML(name) {
    const c = AD_SLOTS[name];
    if (!c) return '';
    const client = 'ca-pub-3017794863315078';
    if (c.layout === 'in-article') {
      return `<ins class="adsbygoogle"
        style="display:block; text-align:center;"
        data-ad-layout="in-article"
        data-ad-format="fluid"
        data-ad-client="${client}"
        data-ad-slot="${c.slot}"></ins>
<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>`;
    }
    return `<ins class="adsbygoogle"
        style="display:block"
        data-ad-client="${client}"
        data-ad-slot="${c.slot}"
        data-ad-format="auto"
        data-full-width-responsive="true"></ins>
<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>`;
  }

  function inject() {
    document.querySelectorAll('.ad-slot[data-ad]').forEach(el => {
      const name = el.getAttribute('data-ad');
      el.innerHTML = adHTML(name);
      el.classList.add('ad-loaded');
    });
  }

  if (!document.querySelector('script[src*="adsbygoogle.js"]')) {
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3017794863315078';
    s.crossOrigin = 'anonymous';
    document.head.appendChild(s);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
