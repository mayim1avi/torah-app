# Torah App

Spotify-style Torah content streaming app — browse categories, listen to lessons, save favorites, and track history.

## Stack

| Layer | Tech |
|---|---|
| Mobile | Expo (React Native) + Expo Router |
| Web | Next.js 15 (App Router) |
| API | Fastify (Node.js ESM) |
| Database | MySQL (existing `torha` DB) |
| State | Zustand |
| Server state | TanStack Query v5 |
| Audio (mobile) | expo-av |
| Audio (web) | HTML5 Audio |
| Auth | JWT + bcrypt, 90-day tokens |
| Monorepo | Turborepo + pnpm workspaces |

## Structure

```
torah-app/
├── apps/
│   ├── mobile/          # Expo React Native app
│   └── web/             # Next.js web app
├── packages/
│   ├── api-client/      # TanStack Query hooks + fetch client
│   ├── store/           # Zustand stores (player, auth, filters)
│   └── ui/              # Shared React Native components
└── services/
    └── api/             # Fastify REST API
```

## Getting Started

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 10
- MySQL running on port 9030 with the `torha` database

### Install

```bash
pnpm install
```

### Configure

```bash
cp services/api/.env.example services/api/.env
# Edit .env with your DB credentials and JWT secret
```

### Run

```bash
# API (port 3001)
pnpm api

# Mobile (Expo)
pnpm mobile

# Web (port 3000)
pnpm web
```

## Features

- **Browse** — category tree with subcategory drill-down and breadcrumbs
- **Search** — full-text search with teacher typeahead and institution filters
- **Audio player** — background playback, queue, speed control, scrubable progress bar
- **Library** — save lessons, resume progress, listen history
- **Auth** — register/login with JWT, persisted across sessions

## Mobile Screens

| Screen | Route |
|---|---|
| Home | `/(tabs)/` |
| Search | `/(tabs)/search` |
| Library | `/(tabs)/library` |
| Category | `/category/[id]` |
| Series | `/series/[id]` |
| Lesson | `/lesson/[id]` |
| Auth | `/auth` |

## API Endpoints

```
GET  /api/categories
GET  /api/categories/:id
GET  /api/categories/:id/content
GET  /api/series/:id
GET  /api/series/:id/lessons
GET  /api/lessons/:id
GET  /api/teachers
GET  /api/institutions
GET  /api/search

POST /auth/register
POST /auth/login
GET  /auth/me

GET    /api/user/library
GET    /api/user/library/:lessonId
POST   /api/user/library/:lessonId
DELETE /api/user/library/:lessonId
POST   /api/user/progress
GET    /api/user/progress/:lessonId
GET    /api/user/history
```

## App Store

EAS Build config is at `apps/mobile/eas.json`.

```bash
# Install EAS CLI
npm install -g eas-cli

# Build for Android (APK)
cd apps/mobile
eas build --platform android --profile preview

# Build for production
eas build --platform all --profile production
```
