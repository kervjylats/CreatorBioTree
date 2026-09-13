# Messaging — Vision & Spec

## Concept

**Free, WhatsApp-style messaging across the whole platform.** Three directions, one engine:

- **Creator ↔ Creator** — before and after collabbing (Network context)
- **Creator ↔ Fan** — anyone with a fan account can message a creator
- **Fan ↔ Creator's Partners** — fans can also contact the creator's partners directly
- **Guest → Creator** — guests can reach out via a Contact button (email capture on first message)

All messaging is **completely free**. No paid DMs, no per-message pricing. The 💬 catalog item is a free "Message me" entry point, not a paid product.

**Why this is a differentiator (competitor research):** the link-in-bio world (Linktree, Stan Store, Beacons) has **zero in-app chat** — their "messaging" is Instagram auto-DM + email only. Patreon has DMs but gates them hard (paid members only, no member↔member). Nobody combines creator↔fan chat + creator↔creator collab chat + paid-free openness the way this spec does.

---

## Part 1: The Floating Inbox (both sides)

A small **💬 inbox icon in the corner, visible on EVERY screen** — like the notification bell, but for messages.

- **Dashboard (creator):** floating icon bottom-right
- **Fan shell:** header **chat icon (top-right)** + a floating bottom-right inbox; the full inbox expands in place (no routing)

**Click → popover, WhatsApp-style:**
- All conversations listed, **newest message first** (1-on-1s, group chats, requests)
- Unread badge per conversation + total badge on the icon itself
- Each row: avatar, name, last message preview, time

**"Open full" button** in the popover → the complete messaging screen with ALL features:
- Full conversation list, search, per-conversation thread view
- Files/attachments, group management, block/mute, requests folder
- (Creator side) community admin controls

The inbox icon shows a **red badge with the unread count**, updated via light polling (mock) or realtime (production) — see Part 6.

> **The inbox stays neutral** — it's a platform-level surface shared across all conversations, not a creator-themed surface. A fan who follows 4 different creators sees the same inbox for all of them; only the OTHER person's avatar + name + community name appear, the inbox shell itself doesn't rebrand. See `features/branding.md` Part 3 (what the theme does NOT control).

---

## Part 2: 1-on-1 Chat

### Entry points — a small chat icon next to names

| Who | Where the chat icon appears |
|---|---|
| Creator → creator | Next to creators' names in **Network** — search results, creator cards, collab list. Works **before AND after collabbing** |
| Fan → creator | **"Message me"** button on the fan page (the 💬 catalog item — now free) + icon next to the creator's name in the shell |
| Fan → partner creator | Same chat icon on **partner names** (Connect tab, partner page) — fans can contact the creator's partners directly |
| Guest → creator | **"Contact" button** on the guest page → email capture → creates a **Follower** row (`fan_accounts`, no password — `fan-shell.md` Part 1, Layer 1b) → conversation starts from that follower identity |

**Quick chat vs full view:**
- Tapping the icon → **quick mini chat box** (small popover with the thread) for casual contact
- **"Open fully"** → the complete messaging screen (all features)

### Conversation rules

- **Find-or-create:** tapping message on someone with no existing conversation creates one (WhatsApp pattern)
- **Guests:** first message requires **email capture** (tied to the fan-account model — same-email; the captured email creates a **Follower** row if one doesn't exist — `fan-shell.md` Part 1, Layer 1b). No anonymous spam.
- **Fan accounts** (per-creator, fan-shell account model) are the identity for fan-side messaging
- **Read state:** last-read timestamps per participant, unread counts
- **Messages:** text, emoji, files (Part 4). Edit/delete own messages (delete = "deleted" tombstone, WhatsApp-style)
- **Typing indicators + presence:** optional polish (broadcast channels) — nice-to-have, not v1-required

### Privacy controls (Reddit/TikTok-style, applied to ALL parties)

**Same controls for creators AND fans.** Everyone can:

| Control | Behavior |
|---|---|
| **"Allow messages from anyone" toggle** | ON = any stranger can message. OFF = only people already interacted with (fans, partners, existing conversations). Applies to both creators and fans (a fan can turn it off to stop a creator/partner messaging them) |
| **Requests folder** | When OFF, a stranger's first message lands in **Requests** — approve to open the conversation, or ignore/block. (Instagram request-inbox style, simplified) |
| **Block list** | Per-person block — fan, creator, or partner. Blocked = can't DM you, can't add you to a group. Visible list, unblock anytime |
| **Mute** | Per-conversation notifications off |
| **Leave** | Leave any 1-on-1 or group |

---

## Part 3: Community *(DECIDED — 2026-08-04, one at a time with the founder)*

A creator's own clubhouse — the umbrella space holding multiple named **channels** (General / Announcements / VIPs / Partner collab). Built 100% on the messaging engine: every channel is a group conversation, the community is the container that groups them. **Chat channels only — no post/feed surface in v1** (Skool/Circle-style feeds can come later).

### The 10 decisions

| # | Topic | Decision |
|---|---|---|
| 1 | What's inside | **Chat channels only.** Clubhouse = umbrella over named channels, reusing the messaging engine 1:1. No feed in v1 |
| 2 | Money | **Free** — like messaging. Engagement tool, not a revenue line |
| 3 | Fan entry | **Home tab section** (the activity hub). No new nav, no 5th tab |
| 4 | Who joins | **Fan account required.** One-tap join, leave anytime. Guests see a "Sign up to join" prompt |
| 5 | Channels | **Defaults + custom.** 4 starter rooms (General, Announcements, VIPs, Partner collab); creator adds/renames/hides anytime |
| 6 | Access | **Per-channel gates.** Open to all members, or restricted to specific roles/members. Roles: Member / VIP / Partner |
| 7 | Moderation | **Creator-only, full:** add/remove members, assign roles, create/hide channels, pin, block, delete messages, announcements-only toggle. No fan mods in v1 |
| 8 | Join rules | **All 3 modes**, one per community, changeable anytime: open / fans & partners only / invite-only |
| 9 | Guest CTA | **"Join the community" card** on the guest fan page → existing fan-auth modal → lands in the Home tab community section |
| 10 | Who creates | **Creators only.** Fans join, never host. One community per creator in v1 (channels inside — Discord-server style) |

### Where it lives

- **Fan Home tab** — a "Community" section in the activity hub: community name + branding, join/leave button, and the channel list (open channels read directly; restricted channels show a lock + join-request/role check). See `fan-shell.md` Part 4a.
- **Guest fan page** — a "Join the community" card (decision #9) prompting signup; chats stay behind the fan-account wall (decision #4).
- **Creator dashboard** — Community admin lives in the full messaging screen ("Open full" → community admin controls, per `messaging.md` Part 1). One place to manage channels, roles, members, join rules.

### Join rules (decision #8)

| Mode | Behavior |
|---|---|
| **Open** | Any fan account joins free, one tap |
| **Fans & partners only** | Requires following the creator or being a partner (follow status checked at join) |
| **Invite-only** | Creator sends invites; invitee accepts in the Home tab community section |

One setting per community, changeable anytime by the creator. Changing a community from open → invite-only does NOT kick existing members — it only stops new self-joins.

### Channels & roles (decisions #5 + #6)

- **Defaults on creation:** General (open) · Announcements (announcements-only) · VIPs (restricted) · Partner collab (restricted). Creator can add/rename/hide more anytime.
- **Per-channel access:** `open` (every member sees it) or `restricted` (only members holding a role — VIP / Partner — or specific invited members see + post).
- **Roles:** Member (default, all joiners) · VIP · Partner. Creator assigns/revokes per member from community admin. A member can hold multiple roles.
- **Announcements-only** is a per-channel toggle (same "only I can post" from Part 4) — the Announcements default channel ships with it on.

### Moderation (decision #7)

Creator controls (community admin): add/remove members, assign/revoke roles, create/hide channels, pin messages, block members (reuses the global `blocked_users` list — block works across chats), delete any message, toggle announcements-only per channel. Members can leave anytime. No fan moderators in v1 — adding them later is a roles extension, not a redesign.

### Guest CTA (decision #9)

Guest page gets a "Join the community" card. Tap → existing fan-auth modal (signup/login) → on success, fan lands on the Home tab community section and can join the open community immediately. The card is creator-configurable (show/hide in My App? — no, it's always-on in v1; the community itself is optional).

### Build note

Community is **Phase 3** of the messaging build (see Part 9) — it ships only after the engine (Parts 1-2) + groups (Part 4) exist, because it's built entirely on them. Community spec is frozen NOW; wiring happens in the Phase F pass.

> **Cross-ref:** the creator-side view of community MEMBERS (list, roles, per-person profile) lives in `relationships.md` — the fan/profile drawer covers community members too. This part covers the community itself (channels, rules, moderation).

---

## Part 4: Group Chats + Announcements

### Group chats (WhatsApp-style)

- **Creators create group chats** (in the full messaging screen): name, emoji, add fans + partners + other creators
- Creator (owner) controls: add/remove members, rename, delete chat, pin
- **Announcements mode** — per-chat toggle: **"Only I can post"** → read-only for everyone else (notice board, like Discord `#announcements`). **In v1.** Used for: "🎬 New video is live!"
- Members: leave anytime; report/block within group handled by the same block list

### Files & attachments

- Images, videos, docs via `/api/chat/upload` (≤8MB, 10/min; stored in the mock `chat-attachments` bucket — the catalog `/api/creator/upload` pattern)
- Per-message attachments: `message_attachments` rows, rendered inline (image preview) or as download cards
- Mock: in-memory storage via the mock storage API (`makeStorageApi()` in `src/lib/mocks/mockSupabaseClient.ts`); Production: existing S3/upload service
- Size limits: TBD at wiring (align with catalog upload caps)

---

## Part 5: Data Model

| Table | Purpose |
|---|---|
| `conversations` | id, type (`direct` / `group` / `community_chat`), title (groups), creator_id (group/community owner), created_at, last_message_at, pinned |
| `conversation_members` | conversation_id, participant_key (fan_account_id / creator_id), role (owner/admin/member), last_read_at, muted_at, added_at, left_at |
| `messages` | id, conversation_id, sender_key, body, attachment refs, edited_at, deleted_at (tombstone), created_at |
| `message_attachments` | id, message_id, storage_url, mime, name, size |
| `message_requests` | id, from_key, to_key, status (pending/approved/ignored), created_at — the Requests folder |
| `blocked_users` | blocker_key, blocked_key, created_at |
| `communities` | id, creator_id (owner), name, icon, join_rule (open / fans_partners / invite_only), created_at — one per creator in v1 (Part 3) |

**Participant keying:** fan side uses the per-creator `fan_accounts` (fan-shell model); creator side uses `creators.id`. A person who is both uses the appropriate key per context (same as the two-auth-system split elsewhere).

**Community = container over conversations.** A community's channels ARE `conversations` (type `community_chat`) with the creator as owner; `conversation_members.role` carries Member / VIP / Partner (Part 3). Channel membership, per-channel `restricted` access, and announcements-only all reuse the existing group mechanics — `communities` only wraps them (id, owner, name, icon, join_rule).

---

## Part 6: Real-time Strategy

| Mode | Approach |
|---|---|
| **Mock (`USE_MOCKS=true`)** | **Polling only** — inbox + thread fetch on open, light polling (e.g., 5-10s) for unread badges. No WebSocket infra. Fits the mock Supabase client (no realtime implementation) |
| **Production** | **Supabase Realtime** — Postgres Changes on `messages` (durable, ~50-200ms latency, fine for chat) + Broadcast for typing indicators. Free tier: 200 concurrent conns / 2M msgs per month — plenty for v1. RLS-based channel security per conversation |
| **Scale-out option** | **Ably** (free 6M msgs/mo, 200 conns) — purpose-built chat SDK (1:1, groups, reactions, read receipts) if chat becomes a core feature. Migration path documented, not built |

### Libraries research (documented for the wiring phase)

| Option | Free tier | Verdict |
|---|---|---|
| **Supabase Realtime** | 200 conns, 2M msgs/mo | ✅ **Primary** — we already use Supabase; Postgres Changes = durable chat history + live updates |
| **Ably** | 6M msgs/mo, 200 conns | 🟡 Upgrade path if chat becomes core — purpose-built chat SDK |
| **Stream** | 1,000 MAU | 🟡 Great SDK but $399/mo after free tier — heavy dependency |
| **Sendbird / CometChat** | 100 MAU | ❌ Free tier too small |
| **Chatpack** (npm, MIT) | Free | 🟢 Pattern reference (1:1 engine + SSE + Next.js App Router) — no groups/files in v0 |
| **OpenHive** (npm, MIT) | Free | 🟢 Reference implementation — Slack-clone on **Next.js + Supabase + shadcn** (same stack): DMs, group DMs, threads, reactions, file uploads via Supabase Storage |

---

## Part 7: API Routes

| Route | Purpose |
|---|---|
| `GET/POST /api/chat/conversations` | List my conversations / create (find-or-create direct) |
| `GET/POST /api/chat/conversations/[id]/messages` | Thread history / send message |
| `PATCH/DELETE /api/chat/messages/[id]` | Edit / delete (tombstone) |
| `POST /api/chat/conversations/[id]/read` | Mark read (last_read_at) |
| `POST /api/chat/conversations/[id]/members` / `DELETE .../members/[key]` | Group add/remove |
| `PATCH /api/chat/conversations/[id]` | Rename, pin, announcements toggle |
| `POST /api/chat/upload` | Message attachments (reuses upload infra) |
| `GET/POST /api/chat/requests` | Requests folder list / approve-ignore |
| `POST /api/chat/block` / `GET /api/chat/blocks` | Block list management |
| `GET /api/chat/unread` | Unread badge counts (polled) |
| `PATCH /api/chat/preferences` | "Allow messages from anyone" toggle + mute prefs |

Auth: fan-side cookie sessions (`fan_` pattern) or creator auth (`mock_auth_uid` / Supabase), matching whichever party is making the request — same split as the rest of the app.

---

## Part 8: Component Plan (single file + exports)

Per founder request: **one `ChatShell.tsx` file** (in `src/components/`, wired at Phase F) exporting hooks/components where necessary:

- `useChat` — conversation list + unread polling hook
- `ChatInboxPopover` — the floating-icon popover (WhatsApp-style list + "Open full")
- `ChatThread` — full conversation view (messages, composer, files)
- `MessageList` / `MessageBubble` / `MessageComposer` / `AttachmentPreview`
- `ChatIcon` — the per-name quick-chat icon (mini box + open-full)
- `useUnreadBadge` — badge count hook for the floating icon / sidebar

---

## Part 9: Build Priority

### Phase 1 — Engine + Inbox
1. Data model + `/api/chat/*` routes (mock store: conversations/messages/attachments)
2. Floating inbox popover (dashboard + fan shell) with unread badge
3. 1-on-1 thread view (send, list, read state) + quick chat icon entry points
4. Requests folder + "Allow messages from anyone" toggle + block list

### Phase 2 — Groups + Files
5. Group chats (create, members, rename, pin, leave)
6. Announcements mode ("only I can post" toggle)
7. Attachments (upload + inline render)

### Phase 3 — Community
8. Community umbrella (Part 3 — full spec decided 2026-08-04): `communities` table + join rules + default channels + per-channel gates + roles (Member/VIP/Partner) + creator community admin + guest-page CTA + Home tab section

---

## Part 10: Notifications & Surfacing

| Surface | What it shows |
|---|---|
| **Floating inbox badge** | Unread total (polled) |
| **Dashboard Overview activity feed** | 💬 "New message from Priya" / "Alex joined your chat" events |
| **Dashboard sidebar (Messages entry)** | Unread badge (if sidebar Messages nav is added) |
| **Fan Home tab** | "Your activity" section gets a recent-messages/community mini-row |
| **Bell (fan shell)** | New DM / group message / added-to-chat notifications (push broadcast later) |

---

## Part 11: Open Decisions (decided with founder)

| Topic | Status |
|---|---|
| Pricing | ✅ **Completely free** — no paid DMs; 💬 catalog item becomes a free "Message me" button |
| Who can message | ✅ Anyone (guests via email capture); creator/fan toggles control OFF-states |
| Privacy | ✅ TT/Reddit-style: global "allow anyone" toggle + requests folder + per-person block — for ALL parties |
| Group chats | ✅ Creators create; owner controls; members leave; announcements mode in v1 |
| Community | ✅ Decided — chat channels only, free, Home-tab section, account required, defaults + custom channels, per-channel gates, creator-only moderation, all 3 join rules, guest CTA, creators create. Full spec in Part 3 |
| Inbox icon placement | ✅ **Built (Sheet 12):** dashboard floating bottom-right; fan shell header icon (top-right) + floating bottom-right |
| Real-time | ✅ Polling in mock; Supabase Realtime in production; Ably as scale-out path |
