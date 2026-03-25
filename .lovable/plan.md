

# Fix Sitemap 404 Error

## Problem
The `_redirects` catch-all rule `/* /index.html 200` intercepts ALL requests including static files like `sitemap.xml` and `robots.txt`, serving the SPA's `index.html` instead of the actual file.

Lovable uses its own hosting infrastructure. The `_redirects` file needs to explicitly exclude static files from the SPA fallback.

## Solution

### Step 1: Update `_redirects` to serve static files first
Add explicit rules for `sitemap.xml` and `robots.txt` BEFORE the catch-all:

```
/sitemap.xml    /sitemap.xml    200
/robots.txt     /robots.txt     200
/*              /index.html     200
```

Redirect rules are processed top-to-bottom; the first match wins. This ensures these files are served directly.

### Step 2: Verify build output
Run a build to confirm `sitemap.xml` and `robots.txt` exist in `dist/`. Vite automatically copies everything from `public/` to the build output, so this should already work -- but we'll verify.

## Files Modified
- `public/_redirects` -- add explicit static file rules above the catch-all

