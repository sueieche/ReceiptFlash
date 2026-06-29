// ===== ReceiptFlash 共用 JS — Neo-Brutalist Style =====

(function() {
  const NAV_ITEMS = [
    { href: '/', label: '首頁', match: /^\/(index\.html)?$/ },
    { href: '/about.html', label: '關於我們', match: /^\/about\.html$/ },
    { href: '/blog/', label: '教學', match: /^\/blog\/?$/ },
  ];

  function renderHeader() {
    const path = window.location.pathname;
    const navHTML = NAV_ITEMS.map(item => {
      const active = item.match.test(path) ? ' class="active"' : '';
      return `<a href="${item.href}"${active}>${item.label}</a>`;
    }).join('');

    return `
      <header class="site-header">
        <div class="container" style="display:flex;justify-content:space-between;align-items:center;width:100%;">
          <a class="brand" href="/">
            <div class="brand-mark"></div>
            <div>
              <div class="brand-text">ReceiptFlash</div>
              <div class="brand-sub">現金實支報告</div>
            </div>
          </a>
          <nav class="nav-pill">${navHTML}</nav>
          <a class="cta-nav" href="https://receiptflash.com/#upload">免費試用 →</a>
        </div>
      </header>
    `;
  }

  function renderFooter() {
    return `
      <footer class="site-footer">
        <div class="footer-grid">
          <div>
            <a class="brand" href="/" style="color: var(--yellow);">
              <div class="brand-mark"></div>
              <div>
                <div class="brand-text">ReceiptFlash</div>
                <div class="brand-sub">現金實支報告</div>
              </div>
            </a>
            <p style="margin-top: 16px; color: #B0B0B0; font-size: 14px; max-width: 280px;">
              專為港澳影視製作行業設計。<br>上傳 Excel,30 秒出專業報告。
            </p>
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
        </div>
        <div class="footer-bottom">
          <span>© 2026 Receipt Flash. All rights reserved.</span>
          <span>Powered by Cloudflare.</span>
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
