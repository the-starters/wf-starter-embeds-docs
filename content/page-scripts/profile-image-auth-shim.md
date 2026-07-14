---
title: "Profile Image Auth Shim"
source: profile-image-auth-shim.js
---

Source: `profile-image-auth-shim.js` (repo root)

> **⏳ Interim bridge — remove me.** This shim exists only to keep the build-profile wizard's
> photo upload working after the Xano endpoint was auth-hardened. It should be **deleted once the
> wizard's own `uploadImage()` adopts the new contract** (Bearer token + no `member_id`). Until
> then it silently patches the gap; after that it is dead weight. Tracking note in the source
> header: `product-workflows/freelancer-profiles/photo-migration/build-profile-wizard-AUTH-PATCH-20260714.md`.

## What it is

A transparent `window.fetch` wrapper that fixes profile-photo uploads to the Xano
`build_profile/starter/profile_image` endpoint. That endpoint was auth-hardened on
2026-07-13 — it now requires a `user_v3` Bearer token, no longer accepts a `member_id` input,
and enforces a 2MB / jpg-png-webp cap. The inline uploaders on `/build-profile/full-profile`
and `/starter-edit-profile` still POST `{ image, member_id }` with **no** `Authorization`
header, so they 401. This shim intercepts exactly those requests and repairs them.

For an **unauthenticated POST to the profile-image endpoint** (and nothing else), it:

1. **Trades the Memberstack JWT for a Xano `user_v3` token** at
   `api:g1vmSLWh/auth/trade-token/v3` — the same auth bridge Opportunities 3.0 uses. The token
   is cached in-memory and re-traded if a request later comes back `401`.
2. **Downscales the image client-side** — longest side ≤ 800px, re-encoded as JPEG at quality
   0.8 — so the server's 2MB cap is never the user's problem. Transparent PNGs are flattened
   onto white (JPEG has no alpha); undecodable files pass through unresized.
3. **Re-issues the request** with the `Authorization: Bearer …` header and **without**
   `member_id` (the endpoint derives the caller from the token).

Requests that already carry an `Authorization` header (e.g. `complete-profile-photo.js`
v1.18.0) and every other URL/method **pass through untouched**, so the shim is safe to load on
any page.

## File structure

```
profile-image-auth-shim.js   (~170 lines)
```

Load with `defer`, **after** Memberstack (it needs `window.$memberstackDom.getMemberCookie()`),
on any page whose uploader still uses the old contract. Run-once guard: a second load returns
early once `window.__tsProfileImageAuthShim` is set. It has no markup hooks — it only patches
`fetch`.

## Notes & gotchas

- **Interception is narrow by design.** A request is only rewritten when all three hold: URL
  contains `/api:KZf7nFnk/build_profile/starter/profile_image`, method is `POST`, and there is
  no `Authorization` header. Miss any one and the original `fetch` runs unchanged.
- The token trade uses the **original** (un-wrapped) `fetch`, so the auth call itself never
  recurses through the shim.
- On a `401` from the upload, the cached token is cleared so the next attempt re-trades — handles
  an expired Xano token without a page reload.
- If the FormData has no `image` field, the shim still adds the auth header but sends nothing to
  resize (logged as a pass-through); the server then returns its own validation error.
- `DEBUG_LOG` at the top controls the `[pi-auth-shim]` `console.info` logging. It is **on** in
  the shipped file.
- Constants live at the top of the file: `ENDPOINT_PATH`, `XANO_AUTH_URL`, `MAX_DIMENSION`
  (800), `JPEG_QUALITY` (0.8), `MAX_UPLOAD_BYTES` (2MB).
