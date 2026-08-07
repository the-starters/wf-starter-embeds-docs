---
title: "Messages 3.0"
source: v3/messages.js
---

Source: `v3/messages.js` (loaded via jsDelivr CDN) — **v1.59.108**

## What it is

The **`/messages` page controller** — a self-contained bootstrap that mounts a
[TalkJS](https://talkjs.com/) inbox for the logged-in member. It has no dependency on the
Opportunities core; the only globals it needs are Memberstack's `$memberstackDom` (already on
the page) and the TalkJS SDK, which it loads itself.

On load it:

1. Waits for `window.$memberstackDom` (polls every 100ms, 10s timeout).
2. Reads the current member. **Logged-out visitors are sent to
   `/login?next=<current path and query>`** via `location.replace`, so `/messages` leaves no
   back-button trap and the V3 login router returns them to the page — including its `?with=`
   deep link — after they sign in.
3. Loads `https://cdn.talkjs.com/talk.js` and waits for `Talk.ready` (15s timeout).
4. Builds a `Talk.User` from the member's Memberstack fields, opens a `Talk.Session` against the
   TalkJS app, creates an inbox with the **`the-starters-3-0`** theme, and mounts it into
   `#talkjs-container`.
5. **After** mounting, resolves a `?with=` deep link if there is one.

Any failure along the way is caught and logged as `[messages-3.0] Unable to mount TalkJS
inbox` — the page does not throw.

## File structure

```
v3/messages.js   (~370 lines)
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

## Deep links: `?with=`

`/messages?with=<memberstack id>` opens — creating it when it does not exist — the one-on-one
conversation with that member, and selects it in the inbox.

- The id must match `mem_<alphanumeric>` or the Test Mode form `mem_sb_<alphanumeric>`. Anything
  else is a hand-edited or truncated URL and is ignored, because TalkJS would happily create a
  real user record for it.
- A **self-link is skipped**, since it would produce a degenerate one-participant conversation.
- The conversation gets `custom.source = "hire-page"` and `custom.slug`. TalkJS custom values must
  be strings, and neither can be backfilled onto conversations created earlier.
- Deep-link resolution runs **after** the inbox is mounted and is deliberately **not awaited**, so
  a failure degrades to "your normal inbox" instead of taking the page down. A failure logs
  `[messages-3.0] Unable to open the requested conversation`.
- Without the parameter, none of this runs and the page behaves exactly as it did before.

**Who produces these links today:** the profile Message button. `v3/messages-profile.js` rewrites
its trigger anchor's `href` to `/messages?with=<id>` as an escape hatch — see
[Profile Message Modal](./messages-profile.md#the-messages-fallback-href). Under normal
conditions that link never fires, because the modal suppresses the click and mounts the chat in
place; it matters when the module never boots, or is followed straight from the published markup.

> **Display-field handoff: documented, not implemented.** The module also reads a one-shot
> `sessionStorage` entry, `starters:hire-message-handoff`, for the other participant's name,
> photo, and slug — TalkJS writes any display fields it is given onto that user's **global**
> record, so a URL-carried name would be forgeable. The file header credits `v3/hire-message.js`
> as the producer, **but no such file exists in the repo and nothing currently writes that key**.
> `messages-profile.js` rewrites the href only. In practice every deep-linked conversation
> therefore references the other member by **id alone**, and TalkJS keeps whatever they synced
> themselves — which is the safe fallback the code is designed around. The entry is validated
> (it must name the same member as the URL), cleared on read, and its photo is accepted only when
> it starts with plain `https://`, so the consumer is ready if a producer is ever added.

## Inbox feed filters (v1.26.6 to v1.26.9)

The inbox supports All / Unread / Read filtering through TalkJS **custom conversation
actions**. The script registers three action names and maps each to a `setFeedFilter` call:

| Action name | Feed filter |
| --- | --- |
| `messages-filter-all` | `{}` (everything) |
| `messages-filter-unread` | `{ isUnread: true }` |
| `messages-filter-read` | `{ isUnread: false }` |

The buttons themselves are authored on the TalkJS side (theme/role configuration for the
`the-starters-3-0` theme) as custom conversation actions with those names; there is no page
markup for them. The wiring is feature-detected (`onCustomConversationAction` +
`setFeedFilter`), so an older TalkJS SDK just skips it. It took three patches to land on the
documented API: v1.26.7 switched to TalkJS's own unread predicate, v1.26.8 to the documented
action choice param, and v1.26.9 to direct per-action handlers.

## Member → TalkJS user mapping

The member's `Talk.User` is built from Memberstack fields. **The display name is the first name
alone** — no last name, and never the email:

| TalkJS field | Source | Notes |
| --- | --- | --- |
| `id` | `member.id` | Memberstack member id. |
| `name` | `free-user` custom field, else `first-name` | `free-user` is this site's legacy Memberstack key for the member's first name; there is no `first-name` field in the app, so it is only a forward-compatible fallback. With neither, the name falls back to a **plan-family placeholder**: `Brand Name` for Brands, `Starter Name` for Talent, and `The Starters member` when no mapped plan is active. |
| `custom.company` | `company` custom field | User-level custom data the theme renders under the first name. TalkJS custom values must be strings, and the key is **always sent** so a previously synced company self-clears. A Brand with no company reads the placeholder `Company Name`; everyone else gets an empty string. |
| `email` | `member.auth.email` / `member.email` | Omitted if absent. Never used as the display name. |
| `photoUrl` | `member.profileImage` | Omitted if the member has no profile image. |

The plan family is resolved once, from active plan connections, using a **copy of
`v3/route-guard.js`'s `PLAN_ROLES` map**. The guard is the canonical source: change it first and
mirror the change here. A member holding both a Brand and a Talent plan fails closed to no
family, so they read the generic default rather than being labelled as either.

`v3/messages-profile.js` mirrors this mapping exactly, so a viewer looks identical whether the
conversation is opened from the inbox or from a profile modal.

## Notes & gotchas

- **Config is inlined at the top of the file:** TalkJS app id `LmYV8DIA`, theme
  `the-starters-3-0`, the SDK URL, both timeouts, the `/login` path, and the `with` parameter
  name. Changing the app id, theme, or login path is a one-line edit there.
- The TalkJS loader is a hand-rolled stub (`window.Talk` with a `ready` thenable) so the script
  can `await` readiness without pulling in TalkJS's own snippet — do not also paste the official
  TalkJS bootstrap on the page, or the two will fight over `window.Talk`.
- **Release history.** v1.22.0 shipped the initial bootstrap and **v1.22.1** fixed the
  logged-out redirect path (it now points at `/login`). **v1.39.0** added the `?next=` round
  trip, **v1.59.12** the `?with=` deep link alongside the profile Message modal, and
  **v1.59.108** the first-name display name and the `Company Name` / `Brand Name` /
  `Starter Name` placeholders.
- Timeouts abort rather than hang: if Memberstack or TalkJS never become ready within their
  windows, the mount aborts and the error is logged — the inbox simply does not appear.

Run its focused tests with:

```sh
node --test v3/messages.test.js v3/messages-profile.test.js
```
