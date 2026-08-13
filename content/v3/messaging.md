---
title: "Messaging"
source: v3/starter-dashboard-messages.js
sources:
  - v3/messages.js
  - v3/messages-profile.js
  - v3/starter-dashboard-messages.js
---

Source: `v3/messages.js`, `v3/messages-profile.js`, `v3/starter-dashboard-messages.js`

## What it is

Three independent entry points into the same [TalkJS](https://talkjs.com/) conversation
graph — the full inbox, a chat modal on a Starter's public profile, and a recent-messages
tile on the Starter dashboard. They share the TalkJS app id `LmYV8DIA` and nothing else:
each loads the TalkJS SDK itself, resolves the member itself, and fails independently.

| Surface | File | Page |
| --- | --- | --- |
| Full inbox | `messages.js` | `/messages` |
| "Message this starter" modal | `messages-profile.js` | `/hire/<slug>` |
| Recent messages tile | `starter-dashboard-messages.js` | `/starter-dashboard` |

There is no `v3/hire-message.js` — the profile modal is `messages-profile.js`.

## The `/messages` inbox

Documented in full on **[Messages 3.0](../page-scripts/messages-3-0.md)**: the page
controller that mounts a TalkJS inbox into `#talkjs-container`, redirects logged-out
visitors to `/login?next=<encoded path>`, and wires the All / Unread / Read feed filters.
`/messages` is also a guarded page — [the route guard](./route-guard.md) allows
`brand-paid` and `talent` there — and the profile modal's trigger keeps a
`href="/messages?with=<id>"` fallback that this controller handles as a deep link.

## The profile chat modal

Documented in full on **[Profile Message Modal](../page-scripts/messages-profile.md)**: the
`/hire/<slug>` modal that mounts a TalkJS chatbox with the profiled Starter, so a Brand can
start or resume the conversation without leaving the profile. Its Designer contract is three
CMS-bound identity attributes on the trigger (`messages-profile-message`,
`messages-profile-name`, `messages-profile-photo`) plus an empty `messages-profile-chat`
container inside the modal, and TalkJS loads lazily on the first open so public profile
traffic never pays for the SDK.

Two things about it matter at the platform level:

- **Its role rules depend on [the route guard](./route-guard.md).** Role comes from
  `window.StartersV3RouteGuard.memberRole`, so the guard has to be on the page for them to
  apply at all — a logged-out visitor opens the hire-page signup modal
  (`data-modal-target="signup-modal"`) and is **not** sent to `/quiz`, a free Brand goes to
  `messages-profile-upgrade` or the guard's `brandFreeHome` (`/quiz-results` once the
  Memberstack `starter-quiz` field records completion, `/quiz` until then), a Talent member or
  the Starter themselves never see the trigger, and only a paid Brand reaches the chat.
- **Unlike `/messages`, this modal never passes through the guard.** Every check is
  client-side, so treat them as product gating, not an authorization boundary.

## `starter-dashboard-messages.js` — the dashboard tile

Binds the messages tile on `/starter-dashboard` to the member's recent conversations, from
**two merged sources**:

- Xano `starter/messages/recent` (`api:opp30`, a TalkJS REST proxy) — recent conversations
  including already-read ones.
- The TalkJS JS SDK's `session.unreads` — live unread state, sender name/photo enrichment,
  and the unread count badge.

If the Xano endpoint is unavailable the tile degrades to unreads-only. With no conversations
at all it shows the authored empty state.

### Markup contract

Wiring is wf-xano-style and **multi-instance**: each `data-messages-element="wrapper"`
scopes one rendered instance. All instances share one TalkJS session and one Xano fetch.

| `data-messages-element` value | On | Purpose |
| --- | --- | --- |
| `wrapper` | the instance root | Scopes one rendered instance |
| `list` | inside the wrapper | Where cards are appended |
| `template` | the first card | Cloned per conversation |
| `empty` | inside the wrapper | No-conversations state |
| `loading` | inside the wrapper | Loading state |
| `total` | inside the wrapper | Unread count badge |
| `view-all` | inside the wrapper | Link to `/messages` |
| `name` (alias `title`) | inside the template | Conversation / sender name |
| `name_initials` | inside the template | Initials fallback |
| `preview` | inside the template | Last message preview |
| `time` | inside the template | Timestamp |
| `avatar` | inside the template | Optional avatar container |

| Attribute | On | Purpose |
| --- | --- | --- |
| `data-messages-format` | a bound element | `uppercase` or `lowercase` text transform |
| `data-messages-limit` | the wrapper | Caps rendered cards; default 8 |

The original class-based selectors remain as fallbacks, with `#messages` as the legacy
wrapper.

## Notes & gotchas

- **Do not paste the official TalkJS bootstrap on any of these pages.** Each module
  hand-rolls a `window.Talk` loader stub so it can `await` readiness, and the two would
  fight over the global.
- Timeouts abort rather than hang: Memberstack 10s, TalkJS 15s. On failure the surface
  simply does not appear, and the error is logged.
- `messages-profile.js` renders the `/messages?with=<id>` link **inside the container** if
  TalkJS fails after the modal is already open, so the member never sees an empty box. If
  the module never boots at all, the trigger's own `href` still reaches the conversation.
- Only the dashboard tile talks to Xano; it trades the Memberstack session for a bearer token
  and sends no client-supplied member id. The inbox and the profile modal reach TalkJS
  directly with Memberstack data alone.
