# Receipt Flash

Static site for [receiptflash.com](https://receiptflash.com) — a tool that converts Excel cash-expense reports into clean, shareable web links.

## Stack
- Pure HTML / CSS / JavaScript (no framework)
- Cloudflare Pages hosting + CDN
- Cloudflare Pages Functions (`/api/upload`) for form backend
- Cloudflare R2 for file storage
- Discord webhook for new-upload notifications
- Google AdSense for monetization

## File structure
```
.
├── index.html              # Main upload page
├── about.html              # About us
├── privacy.html            # Privacy policy
├── terms.html              # Terms of service
├── ads.txt                 # Google AdSense authorized sellers
├── robots.txt              # SEO crawl rules
├── sitemap.xml             # SEO sitemap
├── _redirects              # Cloudflare Pages redirect rules
├── assets/
│   ├── style.css           # Shared styles
│   └── main.js             # Shared JS (header/footer injection)
├── _ads/
│   └── adsense.js          # AdSense slot loader
├── _brand/
│   ├── favicon.svg         # Site icon
│   ├── og-image.svg        # Open Graph preview image
│   ├── before-after.svg    # Excel vs Receipt Flash comparison
│   └── template-guide.txt  # Excel template field guide
├── _partials/              # (Reserved for partial HTML templates)
├── blog/                   # SEO articles
│   ├── index.html
│   ├── excel-to-pdf.html
│   ├── excel-to-web.html
│   └── faq.html            # Has FAQ schema.org JSON-LD
└── functions/
    └── api/
        └── upload.js       # POST /api/upload — receives FormData,
                            # stores in R2, sends Discord notification
```

## Environment variables (Cloudflare Pages → Settings → Environment variables)

| Variable | Description |
|----------|-------------|
| `DISCORD_WEBHOOK_URL` | Discord webhook URL for new-upload notifications |
| `RECEIPTS_BUCKET` | R2 bucket binding (variable name matches binding) |

## Local development
```bash
# Just open index.html in browser — no build step
open index.html

# For Functions, use wrangler:
npm install -g wrangler
wrangler pages dev .
```

## Deployment
Push to `main` branch → Cloudflare Pages auto-deploys.
