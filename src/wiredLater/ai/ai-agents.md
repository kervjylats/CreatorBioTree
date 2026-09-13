# AI Agent Workforce — Heads-Up Only (Placeholder)

> ⚠️ **This file is a STICKY NOTE, not a spec.** Full design TBD as the app grows.

## The Vision (in one breath)

An AI-native company hierarchy — from the founder (CEO) down through directors, departments, managers, and staff — where AI agents act as the first employees.

- **Hierarchy:** CEO (founder) → directors → departments → managers → staff/employees
- **Communication:** Agents chat with the founder like real colleagues — over Telegram, WhatsApp, or in-app
- **Capabilities (eventual):**
  - Customer service — view/reply to support emails
  - Bug detection — notice issues instantly and report them
  - Admin tasks — the same invite/role/permission flow as human staff (`admin.md` Part 4)
  - Updates — agent activity feeds into the Admin Overview (`admin.md` Part 3)
- **Access:** Agents are invited like staff — `agent` role + API key (`admin.md` Part 4 → API keys)

## Current Status

- **Not designed.** No agent hierarchy, no communication protocols, no tooling decisions made.
- The founder will know exactly what the agents need once the app is fully built — the workforce shape follows the actual workflows.

## Open Questions (parked until the app is done)

1. Which LLM provider / agent framework?
2. Agent-to-human messaging (Telegram/WhatsApp/in-app) — who builds the bridge?
3. How autonomous should agents be vs. human-approval?
4. What should agents never touch without permission?

---

## Relation to Other Specs

| Spec | Relation |
|---|---|
| `ai/ai-features.md` | The CREATOR-facing AI assistant (floating widget) — unrelated to the workforce |
| `screens/admin/admin.md` | Agents plug into the admin system (invite, roles, audit log, activity feed) |
