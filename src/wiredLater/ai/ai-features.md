# AI Personal Assistant

## What It Is

A single, persistent AI assistant that lives everywhere in the creator dashboard — like ElevenLabs' assistant. Always available, context-aware, and capable of helping with ANYTHING in the app.

Not scattered tools. One assistant, one conversation, infinite use cases.

---

## Where It Lives

**Floating widget** — accessible from any dashboard page.

```
┌─────────────────────────────────────────────────────────────┐
│  Dashboard                                                 │
│                                                    ┌───┐   │
│                                                    │ ✨ │   │ ← Floating AI button
│                                                    └───┘   │  (bottom-right corner)
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  My App content here...                        │    │
│  │                                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│              ┌──────────────────────────────┐               │
│              │ ✨ AI Assistant              │               │ ← Popup on click
│              │                              │               │
│              │ How can I help you?          │               │
│              │ ┌────────────────────────┐   │               │
│              │ │ Type anything...       │   │               │
│              │ └────────────────────────┘   │               │
│              │                              │               │
│              │ Suggested:                   │               │
│              │ • Design a dark theme        │               │
│              │ • Write a course description │               │
│              │ • Suggest pricing for my     │               │
│              │   coaching session           │               │
│              │ • Help me set up Instagram   │               │
│              │ • Show my best-selling items │               │
│              └──────────────────────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

---

## What It Can Do

The AI assistant understands the creator's context (what page they're on, what items they have, their theme settings) and can:

### 1. Design Help
> *"I want a dark theme with neon accents and a modern font"*
→ AI generates theme (colors, font, button style) and applies it to the My App preview

> *"Make it feel like a cozy coffee shop"*
→ AI generates warm brown/tan palette

### 2. Content Creation
> *"Write a description for my social media course"*
→ AI drafts compelling description text and fills it into the course editor

> *"Generate 3 title options for my new ebook"*
→ AI suggests titles with SEO/reach scores

> *"Write a welcome email for my newsletter"*
→ AI drafts the welcome email and fills it into the newsletter editor

### 3. Pricing Advice
> *"What should I charge for a 30-min coaching call?"*
→ AI suggests pricing based on platform benchmarks

> *"Should I offer a subscription or one-time purchase for my course?"*
→ AI explains pros/cons of each model

### 4. Navigation / Onboarding
> *"How do I connect Instagram for auto-DM?"*
→ AI navigates to Integrations page / opens the right settings panel

> *"Show me my analytics"*
→ AI opens Analytics page or shows key stats inline

> *"Where can I set up payments?"*
→ AI points to Settings → Payments (PayPal connect)

### 5. Data Queries
> *"What's my best-selling item this month?"*
→ AI queries catalog data and returns answer inline

> *"How many subscribers do I have?"*
→ AI reads subscriber count and displays it

> *"Show me all items that are still in draft"*
→ AI filters the catalog to show drafts only

### 6. Guidance / Strategy
> *"I'm new here, what should I do first?"*
→ AI walks through first-time setup: profile → theme → first item → deploy

> *"How can I make more money?"*
→ AI suggests: add a tip jar, create a bundle, set up a funnel, start a membership

> *"What's a funnel and should I use one?"*
→ AI explains funnels and offers to help set one up

---

## Creator Experience

### Clicking the AI Button

```
┌──────────────────────────────────────────┐
│ ✨ AI Assistant                    [−] ✕ │
├──────────────────────────────────────────┤
│                                          │
│  Hi! I'm your AI assistant. I can help  │
│  with design, content, pricing, or      │
│  anything in the app. What do you need? │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ Type a message or ask for help...    │ │
│ └──────────────────────────────────────┘ │
│                                          │
│  Quick prompts:                          │
│ ┌────────────────────────────────────┐   │
│ │ 🎨 Design a dark page             │   │
│ │ 📝 Write a product description    │   │
│ │ 💰 Suggest pricing                │   │
│ │ 🔧 Help me set up                 │   │
│ │ 📊 My analytics                   │   │
│ └────────────────────────────────────┘   │
└──────────────────────────────────────────┘
```

### After AI Responds With an Action

If the AI can perform an action (apply a theme, fill a form), it shows a preview + confirmation button:

```
┌──────────────────────────────────────────┐
│  AI: Here's a dark theme with neon       │
│  accents based on your request:          │
│                                          │
│  Background: #0D0D0D                     │
│  Accent: #00FF88                         │
│  Font: Modern (sans)                     │
│  Button: Pill                            │
│                                          │
│  [Apply to My App] [Regenerate]     │
└──────────────────────────────────────────┘
```

If the AI navigates somewhere, it opens the relevant page/panel:

```
┌──────────────────────────────────────────┐
│  AI: Opening Instagram connection       │
│  settings for you...                     │
│                                          │
│  (Automatically navigated to            │
│   Integrations → Auto-DM)               │
└──────────────────────────────────────────┘
```

---

## How It Works

1. **Input** → Creator types a natural language request
2. **Context** → AI receives the current page, available data (catalog items, theme, subscriptions)
3. **Action** → AI decides: answer inline, apply a change, or navigate somewhere
4. **Execute** → If an action: calls the relevant API route and shows result. If a question: responds inline

**Mock mode:**
- AI responds with pre-written templates per intent category
- Design prompts return random curated palettes
- Content prompts return placeholder text
- Navigation prompts simulate opening the page

**Real (future):**
- Calls Groq LLM with full context
- Structured output parsing to determine action type
- Rate-limited per creator (free: 10/day, pro: unlimited)

---

## API Route

| Method | Path | Description |
|---|---|---|
| POST | `/api/ai/assistant` | Main AI assistant endpoint. Accepts `{ message, context }`, returns `{ response, action?, data? }` |

### Mock Response Shape

```ts
// Text response
{ type: "answer", text: "I think $49 is a good price for that course..." }

// Action response (apply theme)
{ type: "action", action: "apply_theme", data: { colors: {...}, font: "sans", ... }, text: "Here's a dark theme I designed..." }

// Action response (navigate)
{ type: "action", action: "navigate", data: { page: "integrations", section: "auto-dm" }, text: "Opening Auto-DM settings..." }

// Action response (fill form)
{ type: "action", action: "fill_description", data: { itemId: "...", description: "..." }, text: "I wrote a description for your course..." }
```

---

## Data Flow

```
Creator: "Design a dark theme"
  → POST /api/ai/assistant { message, context: { page: "my-app", theme, items } }
  → Mock: returns random curated dark palette
  → Frontend: shows preview card + [Apply] button
  → Creator clicks Apply → theme saved to My App state → preview updates live
```

```
Creator: "What's my best-selling item?"
  → POST /api/ai/assistant { message, context: { page: "my-app", items: [...] } }
  → Mock: returns {"type":"answer","text":"Your course 'Social Media Mastery' has the most sales this month."}
  → Frontend: shows inline answer in the chat bubble
```

---

## Implementation Notes

- The AI button is a small floating FAB in the bottom-right corner of every dashboard page
- Chat history is ephemeral (not saved across sessions) — or saved per session in localStorage
- Context is sent with every request: `{ page, theme, itemCount, recentActivity }`
- Old scattered AI code (my-app AI route, ai-summary route) was discarded — does not match this vision
- **PRODUCTION-NOTE:** Real LLM implementation uses Groq. See `docs/HOW_IT_WORKS.md` for migration notes.
- **PRODUCTION-NOTE:** Rate limiting, content moderation, and token cost management needed for real API.
