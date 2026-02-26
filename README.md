# DeepScreen

A premium movie and TV series discovery platform built with Next.js 16, TMDB API, and modern web technologies. DeepScreen provides detailed information, analytics, and tools for exploring movies and series.

## Features

### Discovery & Search
- **Discover** — Browse movies and series with genre filters, rating ranges, year filters, sorting, and pagination
- **Upcoming** — Explore upcoming movies and series with genre filters and release countdown badges
- **Search** — Full-text search for movies, series, and people
- **Compare** — Side-by-side comparison of movies or series with highlighted metrics

### Series Analytics
- **Episode Heatmap** — Visual grid showing episode ratings color-coded by score, with switchable color scales (Default / Classic green→red)
- **Season Trend Chart** — Bar chart showing average rating per season with trend line
- **Episode Rating Chart** — Scatter/line plot of all episodes chronologically (ratingraph-style)
- **Binge Calculator** — Estimate how many episodes per day to finish a series in a given timeframe
- **Episode List** — Sortable table of episodes by rating, air date, or episode number

### Detail Pages
- **Movie & Series Detail** — Full metadata, cast, genres, trailer button, country flags, synopsis, and recommendations
- **Person Detail** — Biography, filmography with deduplicated credits
- **YouTube Trailers** — "Watch Trailer" button linking to the official trailer from TMDB

### Ratings Integration
- **TVMaze** — Default episode ratings (server-side)
- **IMDb via OMDb** — Optional client-side episode ratings with live toggle (requires free API key)

### UX & Branding
- **Dark/Light theme** with system preference detection
- **Internationalization** — Full English and Spanish support via `next-intl`
- **Responsive design** — Mobile-first with optimized layouts
- **DeepScreen branding** — Custom logo (theme-aware) and favicon

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | CSS Variables + Tailwind CSS |
| UI Components | shadcn/ui (Radix UI primitives) |
| Data Fetching | TanStack React Query |
| i18n | next-intl |
| APIs | TMDB, OMDb (optional), TVMaze |
| Icons | Lucide React |

## Getting Started

### Prerequisites
- Node.js 18+
- TMDB API key ([get one here](https://www.themoviedb.org/settings/api))

### Installation

```bash
git clone https://github.com/Daclapo/DeepScreen.git
cd DeepScreen
npm install
```

### Environment Variables

Create a `.env` file in the root:

```env
TMDB_API_KEY=your_tmdb_api_key
```

The OMDb API key is optional and configured per-user in the Settings page (stored in localStorage).

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── [locale]/           # Localized pages
│   │   ├── compare/        # Side-by-side comparison
│   │   ├── discover/       # Browse with filters
│   │   ├── movie/[id]/     # Movie detail
│   │   ├── person/[id]/    # Person detail
│   │   ├── search/         # Search results
│   │   ├── series/[id]/    # Series detail
│   │   ├── settings/       # User settings (OMDb key, theme)
│   │   └── upcoming/       # Upcoming releases
│   └── api/                # API proxy routes
│       ├── omdb/           # OMDb proxy
│       ├── tmdb/[...path]/ # TMDB proxy
│       └── tvmaze/         # TVMaze proxy
├── components/
│   ├── heatmap/            # Episode visualizations
│   ├── layout/             # Header, Footer, Theme
│   ├── media/              # MediaCard, CompactRow, Skeletons
│   ├── series/             # Binge calculator
│   └── ui/                 # shadcn/ui components
├── hooks/                  # Custom React hooks
├── i18n/messages/          # en.json, es.json
├── lib/
│   ├── api/                # TMDB, OMDb, TVMaze clients
│   └── constants.ts        # App configuration
└── types/                  # TypeScript interfaces
```

## API Architecture

All external API calls are proxied through Next.js API routes (`/api/tmdb`, `/api/omdb`, `/api/tvmaze`) to keep API keys server-side.

- **TMDB** — Primary data source for movies, series, people, discover, and search
- **TVMaze** — Episode-level ratings (fallback when OMDb not configured)
- **OMDb** — IMDb episode ratings (optional, user-provided key)

## License

MIT
