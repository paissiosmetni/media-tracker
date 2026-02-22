# MediaTracker

A smart media collection manager built with Next.js, Supabase, and AI. Track your movies, TV shows, music, games, and books — get AI-powered recommendations, auto-fill metadata, and share your collection with the community.

## Features

### Media Collection Management
- Track five media types: movies, TV shows, music, games, and books
- Status tracking: Owned, Wishlist, In Progress, Completed (cycle with one click)
- Star ratings (0–5), progress percentage, genre, platform, creator, release date
- Cover image support with poster-style card display
- Notes and AI-generated summaries per item

### AI Assistant
- **Chat interface** at `/ai-assistant` with persistent conversation history
- **Smart recommendations** based on your collection and preferences
- **Auto-fill metadata** — type a title on the Add Media form, click the sparkle button, and AI fetches details (creator, genre, release date, platform, summary). Results appear in a preview panel so you can review before applying.
- **Collection insights** — analyze your media taste and patterns
- **Mood-based suggestions** — get recommendations based on how you're feeling
- **Natural language search** — find items in your collection conversationally
- Dual AI provider support: Groq (Llama 3.3 70B) or Google Gemini (2.5 Flash Lite)

### Community & Sharing
- **Public profiles** — toggle visibility in profile settings
- **Explore page** (`/explore`) — browse media from public collections with type filtering and search
- **Shared profile pages** (`/shared/[username]`) — view any public user's full collection

### Dashboard
- Sidebar layout with collection statistics and type breakdown
- Collapsible stats panel on desktop, horizontal scroll pills on mobile
- Grid/segmented view toggle for media items
- Analytics charts using Recharts

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript (strict mode)
- **UI:** React 19, Tailwind CSS v4, Lucide icons
- **Database & Auth:** Supabase (PostgreSQL, Row Level Security, Auth)
- **AI:** Groq SDK / Google Generative AI SDK
- **Charts:** Recharts
- **Fonts:** Inter + JetBrains Mono (via `next/font/google`)

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- An AI provider API key ([Groq](https://console.groq.com) or [Google AI Studio](https://aistudio.google.com))

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in your credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
AI_PROVIDER=groq
```

### 3. Set up the database

Run the SQL in `supabase-schema.sql` in your Supabase project's SQL Editor. This creates:
- `profiles` — user profiles with public/private visibility
- `media_items` — the core media collection table
- `tags` / `media_tags` — tagging system
- `chat_sessions` — AI conversation history
- Row Level Security policies for all tables
- Triggers for auto-creating profiles on signup and updating timestamps

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

```
media-tracker/
├── app/
│   ├── (auth)/           # Login, signup, OAuth callback
│   ├── ai-assistant/     # AI chat page
│   ├── api/ai/           # AI API route
│   ├── dashboard/        # Main dashboard with sidebar stats
│   ├── explore/          # Community explore page
│   ├── media/
│   │   ├── new/          # Add new media item
│   │   └── [id]/         # View / edit media item
│   ├── profile/          # User profile settings
│   ├── shared/[username] # Public shared collection
│   ├── layout.tsx        # Root layout (Inter font, navbar, footer)
│   ├── page.tsx           # Landing page
│   └── not-found.tsx     # 404 page
├── components/
│   ├── ui/               # Reusable UI primitives (card, button, badge, etc.)
│   ├── navbar.tsx        # Dark cinema bar + mobile bottom tab bar
│   ├── footer.tsx        # Multi-column dark footer
│   ├── media-card.tsx    # Poster-overlay media cards
│   ├── media-form.tsx    # Add/edit form with AI auto-fill
│   ├── ai-chat.tsx       # Thread-style AI chat component
│   ├── star-rating.tsx   # Interactive star rating
│   └── search-bar.tsx    # Search input component
├── lib/
│   ├── ai.ts             # AI provider logic (Groq / Gemini)
│   ├── utils.ts          # cn() class merge utility
│   └── supabase/         # Supabase client/server/middleware
├── supabase-schema.sql   # Database schema and RLS policies
└── public/               # Static assets
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
