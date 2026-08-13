---
title: "Profile Message Modal"
source: v3/messages-profile.js
---

Source: `v3/messages-profile.js` (loaded via jsDelivr CDN) — **v1.59.199**

## What it is

The **"Message this starter" modal** on the `/hire/<slug>` profile template. It mounts a
[TalkJS](https://talkjs.com/) chatbox with the profiled starter inside the page's existing modal,
so a Brand can start or resume the conversation without leaving the profile. The conversation is
created on first open when it does not already exist.

It is inert everywhere else — `start()` returns immediately when the path is not
`/hire/<slug>` — so a sitewide embed is safe but pointless.

Install it in the footer of the `detail_hire` template:

```html
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v3/messages-profile.js"></script>
```

Load the modal embed as usual, and load `v3/route-guard.js` too if you want the role rules to
apply — the viewer's role comes from `window.StartersV3RouteGuard.memberRole`, and without it
every signed-in viewer reaches the chat.

## File structure

```
v3/messages-profile.js   (~925 lines)
```

Run-once guard: a second load returns early once `window.__startersMessagesProfileBooted` is set.
TalkJS is **lazy-loaded on the first open** — `/hire/<slug>` is public and SEO-relevant, so
visitors who never press Message never download the SDK.

## Webflow markup contract

The trigger, with three CMS-bound custom attributes:

```html
<a href="/messages"
   data-modal-trigger="message-modal"
   messages-profile-message="mem_clxz24xki027s0sredlom9psj"
   messages-profile-photo="https://x08a-5ko8-jj1r.n7c.xano.io/vault/.../freelancer-558.jpg"
   messages-profile-name="Brian Chung">Message</a>
```

And an empty container inside that modal, which is where the chat renders:

```html
<dialog class="modal_dialog" data-modal-target="message-modal">
  <div class="modal_backdrop" data-modal-close></div>
  <div class="modal_content">
    <div class="modal_slot">
      <div messages-profile-chat messages-profile-upgrade="/pricing"></div>
    </div>
  </div>
</dialog>
```

### CMS field bindings

| Attribute | Bind to CMS field | Field type |
| --- | --- | --- |
| `messages-profile-message` | Memberstack id | PlainText (**required**) |
| `messages-profile-name` | Name | PlainText (optional) |
| `messages-profile-photo` | Profile Photo Xano | PlainText (optional) |

- **All three must be _field bindings_, not literal values**, or every profile ships the same
  starter's id.
- Bind **`Profile Photo Xano`**, not `Profile Photo`: the latter is an Image field and is not
  reliably offered for attribute binding, while the former is PlainText holding the durable Xano
  vault URL.
- `messages-profile-upgrade` is a **static path, not a binding**. It goes on the chat container
  or on the identity carrier — the same nested `clickable_link` that holds the other
  `messages-profile-*` attributes — never on the outer modal-trigger wrapper.
- **Give the chat container a height in the Designer.** A zero-height box renders a zero-height
  chat.

The identity guard accepts live `mem_<cuid>` ids and Memberstack Test Mode `mem_sb_<cuid>` ids.
It rejects empty suffixes, hyphens, and any other extra underscore, so Designer placeholders and
hand-edited deep links cannot create unintended TalkJS users. A name is truncated at 120
characters, and a photo URL is only accepted when it starts with plain `https://` (TalkJS stores
it verbatim and renders it as an `<img>` source).

## Why this module owns the click

The module **always** calls `preventDefault` and `stopPropagation` on a trigger click, then opens
the modal itself through `window.lumos.modal`'s registry. It deliberately does not rely on
`modal.js`'s click delegation, because that cannot suppress navigation for Webflow's button
component.

That component renders an absolutely-positioned `a.clickable_link` inside a
`div.button_main-wrap[data-modal-trigger]`, and `modal.js` only calls `preventDefault` when the
element it *matched* is itself an anchor:

```js
const trigger = e.target.closest(`[data-modal-trigger='${modalId}']`)
if (trigger.tagName === "A") e.preventDefault()
```

There the match is the wrapping DIV, so the inner anchor's `href` wins and the page navigates
away while the modal is still opening.

Taking the outer wrapper's click has three consequences worth knowing:

- **`data-modal-trigger` becomes optional**, and the CMS identity attributes may sit on either
  the wrapper or the nested `clickable_link` — which is where Webflow publishes attributes
  configured on the Button component.
- **Responsive copies of the Message component inherit the page's one valid CMS identity**,
  because a `/hire/<slug>` page represents exactly one starter.
- The listener is registered in the **capture phase** on the trigger, so it runs before the inner
  anchor's default action and before `modal.js`'s document-level listener.

The module still listens for `modal.js`'s `modal-open` event (ignoring modals that do not contain
the chat container), and a `?modal-id=<id>` URL mounts the chat with no click involved. That
boot-time modal id is captured while the deferred script executes — before `modal.js` strips the
parameter off the URL — rather than read from `dialog.open`, which would misfire on any page that
ships the dialog already open.

## Access table

| Viewer | Outcome |
| --- | --- |
| Logged out | The hire-page signup modal (`data-modal-target="signup-modal"`). Chat intent is dropped in v1 — no auto-continue after signup. Does **not** send the visitor to `/quiz`. Missing signup markup is a staging warning, not a bounce to `/quiz`. |
| Free Brand | `messages-profile-upgrade` when set, else route-guard's `brandFreeHome`: `/quiz-results` once the Memberstack `starter-quiz` field records completion, `/quiz` until then. |
| Talent | Trigger hidden; the modal closes if opened anyway. |
| Viewer is this starter | Trigger hidden; the modal closes if opened anyway. |
| Paid Brand | The chat. |
| Role unknown | The chat. |

The logged-out signup-modal open and the free-Brand redirect **also** run from the capture-phase
click handler, which calls `stopPropagation` so `modal.js` never sees the click — without that,
the message modal would flash open for a frame. This only works once Memberstack has resolved; a
click during that window falls through on purpose, opens the message modal, and is handled by
`openChat()` instead, so a fast click is never silently swallowed. `openChat()` itself opens the
signup modal when the viewer is logged out, after closing the message modal so the two are not
stacked.

**Every check here is client-side**, and unlike the `/messages` route this modal never passes
through route-guard. Treat the rules as product gating, not as an authorization boundary. A
failed viewer lookup leaves whatever the initial pass armed in place, so an outage never strips a
working trigger from a paid Brand.

## The `/messages` fallback href

Keep `href="/messages"` on an anchor trigger. The module rewrites it to
`/messages?with=<memberstack id>`, the deep link
[Messages 3.0](./messages-3-0.md#deep-links-with) understands, so the link still reaches the
conversation if this module never boots. The href is only ever written to an anchor, never
injected into a wrapper div, and it never fires while the module is running because the click is
always suppressed. If TalkJS fails **after** the modal is already open, that same link is
rendered inside the container ("Open this conversation in Messages") rather than leaving an empty
box.

The module clears the container's authored contents on mount, because TalkJS mounts its iframe
without clearing — so a "Loading messages…" placeholder becomes a real loading state, visible
exactly while the SDK is being fetched, instead of sitting behind the chat forever.

## Notes & gotchas

- **Known data gap.** The Webflow mirror of `Memberstack id` stopped being written around
  xano-id 1004, so roughly 7% of `hire` items have an empty field. An empty CMS field renders an
  empty attribute, which is exactly the hidden-trigger path, so those profiles simply show no
  button until they are backfilled — no code change needed afterwards.
- **Staging warnings name the slug.** The module warns when the page has no usable
  `messages-profile-message` identity at all. A profile page usually has several Message controls
  (hero, sticky nav, mobile CTA) and Webflow may publish the CMS attributes on only one nested
  `clickable_link`; the controller arms every wrapper from that page identity, so the warning
  means a missing CMS binding or backfill, not an unbound responsive copy.
- **Conversation attribution.** Conversations opened here carry `custom.source = "hire-page"` and
  `custom.slug`. TalkJS custom values must be strings, and this cannot be backfilled onto
  conversations created earlier.
- **Viewer identity mirrors `/messages`.** The signed-in member syncs to TalkJS as first name
  only, with `custom.company` for the theme — the same mapping as
  [Messages 3.0](./messages-3-0.md#member--talkjs-user-mapping), so a viewer looks identical from
  either surface. The chatbox uses the **`the-starters-3-0-profile`** theme; the inbox uses
  `the-starters-3-0`.
- **The starter's TalkJS record is only written from the CMS.** With no `messages-profile-name`,
  the starter is referenced by id alone and TalkJS keeps whatever they synced themselves —
  passing fields would overwrite that user's global record.
- **Triggers injected after `DOMContentLoaded` are out of scope.** Call
  `window.StartersMessagesProfile.apply()` after injecting one. The object also exposes
  `release`, `decorate`, `identityFrom`, `pageIdentity`, `currentSlug`, `modalId`, and
  `openChat` for console checks.
- Diagnostics appear on staging hosts only (`*.webflow.io`, `localhost`, `127.0.0.1`,
  `*.trycloudflare.com`, or `window.STARTERS_DEBUG === true`); production is silent.

Run its focused tests with:

```sh
node --test v3/messages-profile.test.js v3/messages.test.js
```
