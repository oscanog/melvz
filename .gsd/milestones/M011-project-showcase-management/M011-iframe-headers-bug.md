# Bug Report: Iframe "Refused to Connect" on All Domains

## Status: ✅ RESOLVED

## Issue
Both `luxx.team` and `luxurious-ten.vercel.app` returned "refused to connect" when loaded inside the portfolio iframe at `https://www.melvz.com/#project/luxurious`.

## Root Causes (Two Bugs)

### Bug 1: Deprecated `X-Frame-Options: ALLOW-FROM`
The legacy `X-Frame-Options: ALLOW-FROM https://melvz.com` header was added in M010. Modern browsers (Chrome, Safari, Firefox) **do not support** the `ALLOW-FROM` directive. When they encounter it, they fall back to strict blocking behavior (`DENY` or `SAMEORIGIN`), overriding the valid CSP `frame-ancestors` directive.

**Fix:** Removed `X-Frame-Options` entirely. The modern `Content-Security-Policy: frame-ancestors` supersedes it.

### Bug 2: Missing `www` Subdomain in CSP
The CSP header whitelisted `https://melvz.com` (naked domain), but the portfolio is accessed via `https://www.melvz.com` (with `www`). Browsers treat these as **different origins**. The iframe was blocked because the parent origin wasn't in the allowlist.

**Browser console error:**
```
Refused to frame 'https://luxx.team/' because an ancestor violates the
following Content Security Policy directive: "frame-ancestors 'self'
https://melvz.com http://localhost:* http://127.0.0.1:*"
```

**Fix:** Added `https://www.melvz.com` to `frame-ancestors`.

### Bug 2.5: Vercel CDN Cache Delay
After deploying the fix, the old CSP header persisted in Vercel's edge cache for several minutes. This caused a false-negative during QA — the fix was deployed but browsers still received the stale cached header.

**Fix:** Wait for CDN cache invalidation (~2-3 minutes), or verify headers directly via `curl.exe -sI https://luxx.team`.

## Final `vercel.json` Headers
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "frame-ancestors 'self' https://melvz.com https://www.melvz.com http://localhost:* http://127.0.0.1:*"
        }
      ]
    }
  ]
}
```

## Lessons Learned
1. **Never use `X-Frame-Options: ALLOW-FROM`** — deprecated, actively harmful in modern browsers.
2. **Always whitelist both `www` and naked domain** in CSP `frame-ancestors`. Browsers enforce strict origin matching; `melvz.com` ≠ `www.melvz.com`.
3. **Verify headers with `curl`, not the browser** — browser cache and Vercel CDN cache can serve stale headers for minutes after deploy.
4. **Test from the actual production URL** (not localhost) to catch origin mismatches early.
5. **CSP violations show clear console errors** — always check DevTools Console (F12) first when iframes fail.

## Commits
1. `025f452` — Removed `X-Frame-Options`, added `http://127.0.0.1:*` to CSP.
2. `8f5c9e8` — Added `https://www.melvz.com` to CSP `frame-ancestors`.
