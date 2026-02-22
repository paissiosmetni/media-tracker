# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Dev server:** `npm run dev` (uses Turbopack)
- **Build:** `npm run build`
- **Start production:** `npm run start`
- **Lint:** `npm run lint`

No test framework is configured.

## Environment Setup

Copy `.env.local.example` to `.env.local` and fill in:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase project credentials
- `GROQ_API_KEY` — Groq API key (default AI provider)
- `GEMINI_API_KEY` — Google Gemini API key (alternative provider)
- `AI_PROVIDER` — Set to `groq` (default) or `gemini`

## Architecture

**Next.js 16 App Router** with React 19, TypeScript (strict mode), Tailwind CSS v4, and Supabase for database/auth.

**Font stack:** Inter (body) + JetBrains Mono (code), loaded via `next/font/google`.

### Routing & Auth

- **Route groups:** `app/(auth)/` contains login/signup/callback pages
- **Protected routes:** `/dashboard`, `/media/*`, `/ai-assistant`, `/profile` — enforced in `lib/supabase/middleware.ts` which redirects unauthenticated users to `/login`
- **Auth pages** redirect authenticated users to `/dashboard`
- Root `middleware.ts` delegates to `lib/supabase/middleware.ts` for session refresh on every request

### Supabase Clients

Two Supabase client factories — use the correct one based on context:
- `lib/supabase/client.ts` — browser/client components (`createBrowserClient`)
- `lib/supabase/server.ts` — server components and API routes (`createServerClient` with cookie handling)

### Database

Schema defined in `supabase-schema.sql`. Five tables with Row Level Security:
- **profiles** — extends `auth.users`, auto-created via trigger on signup; has `is_public` flag for profile-level visibility
- **media_items** — tracks movies, TV shows, music, games, books; columns include `type`, `creator`, `genre`, `platform`, `status`, `rating`, `progress`, `ai_summary`; visibility is controlled at the profile level (no per-item public flag)
- **tags** / **media_tags** — tagging system (schema defined but tables may need manual creation in Supabase)
- **chat_sessions** — stores AI chat history as JSONB `messages`

### AI System

- **API route:** `app/api/ai/route.ts` — POST endpoint requiring auth, accepts `{ message, history, collectionData }`
- **AI logic:** `lib/ai.ts` — dual provider support (Groq with `llama-3.3-70b-versatile`, Gemini with `gemini-2.5-flash-lite`)
- **Action detection:** The API route auto-detects action type from message keywords: `smart_recommendations`, `auto_metadata`, `collection_insights`, `natural_search`, `mood_suggestions`, `general_chat`
- **AI auto-fill:** The media form (`components/media-form.tsx`) uses the `auto_metadata` action to fetch details for a title. Results appear in a suggestion preview panel; the user can apply fields individually or all at once.
- **AI chat:** Full-page chat interface at `/ai-assistant` with thread-style messages, right-side history drawer, and quick-action chips

### UI Design

The visual identity is a **"Cinematic Entertainment Hub"** theme inspired by streaming platforms:

- **Navbar:** Always-dark cinema bar (`bg-slate-900`) on desktop with centered tab navigation and underline active indicators. Mobile uses a bottom tab bar (Instagram/Spotify style) with a raised center "Add" button — no hamburger menu. Layout adds `pb-16 md:pb-0` to `<main>` for bottom bar clearance.
- **Footer:** Dark multi-column footer (`bg-slate-900`) matching the navbar, with gradient logo, nav columns, and copyright divider.
- **Cards:** Borderless shadow design (`shadow-md ring-1 ring-black/5`) with 0.5rem radius. Media cards use poster-overlay style (title on gradient over image). No-image cards use type-specific colored gradient backgrounds (blue=movie, purple=TV, green=game, pink=music, amber=book).
- **Badges:** Squared rectangles (`rounded`) instead of pills.
- **Buttons:** `rounded font-semibold` with subtle shadows on primary variant.
- **Inputs/Selects:** Tinted backgrounds (`bg-muted/40`).
- **Toasts:** Top-center positioned, slide-in from top.
- **Color palette:** Slate-tinted neutrals with indigo-500 primary accent.

### Key Components

- `components/navbar.tsx` — Dark top bar + mobile bottom tab bar
- `components/footer.tsx` — Multi-column dark footer
- `components/media-card.tsx` — Poster-overlay cards with status cycling. Exports `MediaCard`, `MediaCardSkeleton`, and `MediaItem` interface.
- `components/media-form.tsx` — Add/edit media form with AI auto-fill (sparkle button in title input, suggestion preview panel with per-field apply)
- `components/ai-chat.tsx` — Thread-style chat with right-side history drawer
- `components/star-rating.tsx` — Interactive star rating input
- `components/search-bar.tsx` — Reusable search input
- `components/ui/*` — Styled primitives (card, badge, button, input, select, toast, dialog, tabs, label, textarea, skeleton, progress)

### Path Alias

`@/*` maps to the project root (configured in `tsconfig.json`).
