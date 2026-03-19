# CLAUDE.md

## Project Overview

Does AI Rank Me is a SaaS app that tests how discoverable a website is to AI assistants. Users enter a URL, the app generates realistic search queries, runs them against AI providers with web search enabled, and checks whether the target domain appears in cited sources.

## Commands

```bash
npm run dev        # Start dev server (http://localhost:3000)
npm run build      # Production build
npm run lint       # Run Biome linter
npm run lint:fix   # Fix lint issues
npm run db:push    # Push schema to database
npm run db:studio  # Open Drizzle Studio
```

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Auth**: NextAuth v5 (credentials provider)
- **Database**: Neon PostgreSQL + Drizzle ORM
- **AI**: Google Gemini with grounded search
- **Linting**: Biome

## Architecture

- `app/(marketing)/` - Landing page (public)
- `app/(auth)/` - Login/signup pages
- `app/(dashboard)/` - Authenticated dashboard, scan views
- `app/api/` - API routes (auth, scans)
- `lib/auth/` - NextAuth configuration
- `lib/db/` - Drizzle client and schema
- `lib/providers/` - AI provider implementations (Gemini)
- `lib/scan/` - Scan engine (scraper, scoring, runner)
- `components/` - React components
- `hooks/` - Client-side hooks

## Workflow

- You may commit and push at any time without asking for permission.

## Key Patterns

- Scans run in background using Next.js `after()` API
- Client polls `/api/scans/[id]` every 2s while scan is running
- Score formula: `(appearanceRate * 0.6 + avgPositionScore * 0.4) * 100`
- Rate limit: 5 scans per user per hour
