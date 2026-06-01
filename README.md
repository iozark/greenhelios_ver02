# idea01 — Property Management App

A full-stack property management dashboard built with Next.js, Prisma, and Tailwind CSS. Track properties, log income and expenses, and generate financial reports.

## Tech Stack

- **Framework:** Next.js 15 (App Router, standalone output)
- **Database:** SQLite via Prisma
- **Auth:** NextAuth.js (credential-based)
- **UI:** Tailwind CSS + shadcn/ui
- **i18n:** next-intl
- **Runtime:** Bun
- **Reverse proxy:** Caddy

## Features

- Property listings with status tracking (Vacant, Occupied, etc.)
- Income and expense logging per property
- Financial reports with date-range filtering
- Notifications
- User profile and settings (currency, language, timezone, date format)
- File upload and download
- Seed endpoint for development data

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) installed
- Node.js 18+

### Install dependencies

```bash
bun install
```

### Set up environment

Create a `.env` file at the project root:

```env
DATABASE_URL="file:./db/dev.db"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

### Set up the database

```bash
bun run db:push
```

### Run the dev server

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database

Schema managed by Prisma. Models: `User`, `Property`, `Income`, `Expense`, `Notification`.

```bash
bun run db:push       # push schema changes
bun run db:migrate    # create a migration
bun run db:reset      # reset the database
```

## Production Build

```bash
bun run build
bun run start
```

The build produces a standalone Next.js output. The `Caddyfile` configures a reverse proxy for production deployment.

## Project Structure

```
src/
  app/
    api/          # API routes (auth, properties, transactions, reports, …)
    (pages)/      # App pages
  components/     # UI and layout components
  i18n/           # Internationalisation config
prisma/
  schema.prisma   # Database schema
db/               # SQLite database files (gitignored)
public/           # Static assets
```
