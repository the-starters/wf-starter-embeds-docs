---
title: "Messages 3.0"
source: v3/messages.js
---

Source: `v3/messages.js` (loaded via jsDelivr CDN)

## What it is

The **`/messages` page controller** — a self-contained bootstrap that mounts a
[TalkJS](https://talkjs.com/) inbox for the logged-in member. It has no dependency on the
Opportunities core; the only globals it needs are Memberstack's `$memberstackDom` (already on
the page) and the TalkJS SDK, which it loads itself.

On load it:

1. Waits for `window.$memberstackDom` (polls every 100ms, 10s timeout).
2. Reads the current member. **Logged-out visitors are redirected to `/login`** (via
   `location.replace`, so `/messages` leaves no back-button trap).
3. Loads `https://cdn.talkjs.com/talk.js` and waits for `Talk.ready` (15s timeout).
4. Builds a `Talk.User` from the member's public profile, opens a `Talk.Session` against the
   TalkJS app, creates an inbox with the **`the-starters-3-0`** theme, and mounts it into
   `#talkjs-container`.

Any failure along the way is caught and logged as `[messages-3.0] Unable to mount TalkJS
inbox` — the page does not throw.

## File structure

```
v3/messages.js   (~159 lines)
```

Load **once** on `/messages` via a page custom-code embed with `defer`, **after** Memberstack.
TalkJS itself is injected by the script, so no separate TalkJS `<script>` tag is needed.
Run-once guard: a second load returns early once `window.__startersMessages3Booted` is set.

## Markup contract

```html
<!-- the inbox mounts here; without it the script throws "Missing #talkjs-container" -->
<div id="talkjs-container"></div>
```

`#talkjs-container` is the only required markup hook. There are no `data-*` attributes.

## Member → TalkJS user mapping

The member's TalkJS `Talk.User` is built from Memberstack fields:

| TalkJS field | Source | Notes |
| --- | --- | --- |
| `id` | `member.id` | Memberstack member id. |
| `name` | `first-name` + `last-name` custom fields | Falls back to email, then to `"The Starters member"`. |
| `email` | `member.auth.email` / `member.email` | Omitted if absent. |
| `photoUrl` | `member.profileImage` | Omitted if the member has no profile image. |

## Notes & gotchas

- **Config is inlined at the top of the file:** TalkJS app id `LmYV8DIA`, theme
  `the-starters-3-0`, the SDK URL, both timeouts, and the `/login` redirect path. Changing the
  app id, theme, or login path is a one-line edit there.
- The TalkJS loader is a hand-rolled stub (`window.Talk` with a `ready` thenable) so the script
  can `await` readiness without pulling in TalkJS's own snippet — do not also paste the official
  TalkJS bootstrap on the page, or the two will fight over `window.Talk`.
- **v1.22.1** fixed the logged-out redirect path (it now points at `/login`); v1.22.0 shipped
  the initial bootstrap.
- Timeouts abort rather than hang: if Memberstack or TalkJS never become ready within their
  windows, the mount aborts and the error is logged — the inbox simply does not appear.
