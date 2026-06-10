# Issue: Custom Domain Iframe — Setup Checklist

## Status: ✅ RESOLVED

## Context
When embedding a Vercel-hosted project (e.g., Luxurious at `luxx.team`) inside the portfolio iframe, the custom domain requires specific configuration at both the DNS level and the Vercel project level.

## Checklist for Adding a New Guest Project Domain

### 1. DNS / Nameservers (Hostinger or registrar)
- Point nameservers to Vercel (`ns1.vercel-dns.com`, `ns2.vercel-dns.com`).

### 2. Vercel Dashboard
- Go to project > Settings > Domains.
- Add the custom domain (e.g., `luxx.team`).
- Wait for SSL to show "Valid Configuration" (usually < 5 minutes).

### 3. Guest Project `vercel.json`
- Set `Content-Security-Policy: frame-ancestors` to include **all** portfolio domain variations:
  ```
  frame-ancestors 'self' https://melvz.com https://www.melvz.com http://localhost:* http://127.0.0.1:*
  ```
- **Do NOT** use `X-Frame-Options: ALLOW-FROM` — it is deprecated and breaks iframe loading in modern browsers.

### 4. Portfolio Database
- Add the showcase entry via `#admin/showcases` with the correct target URL.

### 5. Verification
- Open the custom domain in a new tab first. If it doesn't load, the issue is DNS/SSL.
- If it loads in a tab but not in iframe, check browser DevTools Console for CSP errors.
- If CSP looks correct but iframe still fails, the Vercel CDN may be serving cached headers. Verify with `curl -sI https://domain.com` and wait 2-3 minutes.
