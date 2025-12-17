# Orbita - Contacts World Map

A minimal, elegant web app for visualizing your contacts on a world map. Private by default.

## Features

- **Full-screen map interface** - The map is the primary UI
- **Smart search** - Search by name, location, tags, or language
- **Visual filtering** - Matching contacts highlight, non-matching fade
- **Clustering** - Dense areas automatically cluster
- **Inline editing** - Edit contacts directly in the profile panel
- **Photo upload** - Upload profile images
- **CSV import** - Import contacts from CSV files
- **Magic link auth** - Passwordless sign-in via email

## Deploy to Vercel

### 1. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the schema from `supabase/schema.sql`
3. Go to **Storage** and create a bucket called `avatars` (set to public)
4. Go to **Authentication > URL Configuration** and add your Vercel URL to "Redirect URLs"

### 2. Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo/contacts-world-map)

Or deploy manually:

```bash
npm install -g vercel
vercel
```

### 3. Set Environment Variables

In Vercel project settings, add:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

Get these from **Supabase > Project Settings > API**.

## Local Development

### Prerequisites

- Node.js 18+
- A Supabase project (free tier works)

### Setup

1. Clone the repo
2. Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials
3. Run the SQL schema in your Supabase project

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build

```bash
npm run build
npm start
```

## Design Decisions

### Map as Interface
The map is the entire interface. No sidebars, no dashboards. Just a search input floating over the map. This keeps focus on the spatial relationships between people.

### Intent-based Search
Search parses natural language queries like "under 30" or "designer in Berlin". This avoids cluttered filter UIs while supporting powerful queries.

### Highlight vs Hide
When searching, non-matching contacts fade rather than disappear. This preserves spatial context and avoids jarring layout shifts.

### Collapsible Contact Info
Email and social links are hidden by default in profiles. This respects privacy and reduces visual noise. Users who need contact info can expand it.

### Extensible Social Links
Social links use a generic `{platform, url}` structure rather than hardcoded fields. This makes it easy to add new platforms without schema changes.

### Freeform Attributes
The `attributes` field is a flexible key-value store. This allows different contacts to have different metadata without requiring schema migrations.

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Supabase** - Auth, Postgres database, file storage
- **Leaflet** - Lightweight mapping library
- **leaflet.markercluster** - Marker clustering
- **Lucide React** - Icons

## Project Structure

```
src/
├── app/
│   ├── globals.css      # Global styles + Leaflet overrides
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Main page
├── components/
│   ├── Map.tsx          # Leaflet map with clustering
│   ├── ProfilePanel.tsx # Contact profile (desktop/mobile)
│   └── SearchInput.tsx  # Search bar
├── lib/
│   ├── mockData.ts      # Sample contacts
│   └── utils.ts         # Helpers (cn, search matching)
└── types/
    ├── contact.ts       # Contact type definitions
    └── leaflet.markercluster.d.ts
```

## License

MIT
