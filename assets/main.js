// ===== ReceiptFlash 共用 JS =====

(function() {
  const NAV_ITEMS = [
    { href: '/', label: '首頁', match: /^\/(index\.html)?$/ },
    { href: '/about.html', label: '關於我們', match: /^\/about\.html$/ },
    { href: '/blog/', label: '部落格', match: /^\/blog\/?$/ },
  ];

  function renderHeader() {
    const path = window.location.pathname;
    const navHTML = NAV_ITEMS.map(item => {
      const active = item.match.test(path) ? ' class="active"' : '';
      return `<a href="${item.href}"${active}>${item.label}</a>`;
    }).join('');

    return `
      <header class="site-header">
        <div class="container">
          <a class="brand" href="/">
            <div class="brand-icon">⚡</div>
            <div>
              <div class="brand-text">做單快快 Receipt Flash</div>
              <div class="brand-sub">現金實支報告</div>
            </div>
          </a>
          <nav class="nav" id="main-nav">${navHTML}</nav>
          <button class="nav-toggle" id="nav-toggle" aria-label="選單">☰</button>
        </div>
      </header>
    `;
  }

  function renderFooter() {
    return `
      <footer class="site-footer">
        <div class="container">
          <div>
            <div class="brand-mini">
              <div class="brand-icon">⚡</div>
              <div class="brand-text" style="color:white;">Receipt Flash</div>
            </div>
            <p>專為港澳影視製作行業設計的現金支出報告工具。<br>上傳 Excel,30 秒出專業報告。</p>
          </div>
          <div>
            <h4>產品</h4>
            <ul>
              <li><a href="/">上傳頁</a></li>
              <li><a href="/blog/">教學文章</a></li>
            </ul>
          </div>
          <div>
            <h4>公司</h4>
            <ul>
              <li><a href="/about.html">關於我們</a></li>
              <li><a href="mailto:support@receiptflash.com">聯絡</a></li>
            </ul>
          </div>
          <div>
            <h4>法律</h4>
            <ul>
              <li><a href="/privacy.html">隱私權政策</a></li>
              <li><a href="/terms.html">服務條款</a></li>
            </ul>
          </div>
          <div class="footer-bottom">
            © 2026 Receipt Flash. Powered by Cloudflare.
          </div>
        </div>
      </footer>
    `;
  }

  function attachNavToggle() {
    const toggle = document.getElementById('nav-toggle');
    const nav = document.getElementById('main-nav');
    if (toggle && nav) {
      toggle.addEventListener('click', function() {
        nav.classList.toggle('open');
      });
    }
  }

  function inject() {
    const headerSlot = document.getElementById('site-header');
    const footerSlot = document.getElementById('site-footer');
    if (headerSlot) {
      headerSlot.outerHTML = renderHeader();
      attachNavToggle();
    }
    if (footerSlot) {
      footerSlot.outerHTML = renderFooter();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
