<div align="center">
  <img src="public/images/green-logo-vh.png" alt="Jeriel Logo" width="200"/>
</div>

# Jeriel - Church Management System

<div align="center">

**A comprehensive church management system built with Remix**

Streamline church operations including member management, attendance tracking,
tribal organization, and automated notifications.

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20-green.svg)](https://nodejs.org/)
[![Remix](https://img.shields.io/badge/Remix-v2-blue.svg)](https://remix.run/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue.svg)](https://www.postgresql.org/)

</div>

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Development](#development)
- [Database Management](#database-management)
- [Background Jobs](#background-jobs)
- [Project Structure](#project-structure)
- [Authentication & Authorization](#authentication--authorization)
- [File Storage](#file-storage)
- [Deployment](#deployment)
- [Available Scripts](#available-scripts)

## Features

### Core Functionality

- **Member Management** - Comprehensive member profiles with photos, contact
  information, and role assignment
- **Organizational Structure** - Manage tribes, departments, and honor families
- **Attendance Tracking** - Digital attendance system with conflict detection
  and reporting
- **Notifications** - Automated birthday notifications, attendance reminders,
  and report tracking
- **Messaging** - SMS and email capabilities for member communication
- **Analytics & Reporting** - Statistical dashboards and attendance reports with
  export functionality
- **Role-Based Access Control** - Granular permissions for different user roles

### Automated Features

- Weekly birthday notifications
- Daily birthday SMS messages
- Attendance conflict detection
- Weekly report tracking notifications
- Automated attendance report generation

## Tech Stack

### Frontend

- **Framework**: Remix v2 with React 18
- **Styling**: Tailwind CSS, DaisyUI, shadcn/ui components
- **UI Components**: Radix UI primitives
- **Forms**: Conform with Zod validation
- **Tables**: TanStack Table v8
- **Charts**: Recharts
- **Icons**: Remix Icon, Lucide React
- **Animations**: Framer Motion

### Backend

- **Runtime**: Node.js (>= 20)
- **Server**: Custom Express server with Remix integration
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: remix-auth with form strategy
- **Password Hashing**: Argon2
- **Background Jobs**: Quirrel (cron jobs and queue management)
- **File Storage**: MinIO (S3-compatible)
- **Email**: React Email with Nodemailer
- **SMS**: Letexto API integration

### Development Tools

- **Package Manager**: pnpm 10.20.0
- **Language**: TypeScript
- **Testing**: Vitest
- **Linting**: ESLint
- **Formatting**: Prettier
- **Routing**: remix-flat-routes

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 20.0.0
- **pnpm** 10.20.0 or higher
- **PostgreSQL** database
- **MinIO** server (for file storage)
- **Docker** (optional, for containerized deployment)

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd jeriel
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables (see
   [Environment Configuration](#environment-configuration))

4. Set up the database:

```bash
pnpm db:setup
```

5. Seed the database with a super admin:

```bash
pnpm db:seed
```

## Environment Configuration

Create a `.env` file in the root directory. Use `.env.example` as a template.
Key variables include:

### Database

```env
DATABASE_URL="postgresql://user:password@localhost:5432/jeriel"
```

### Authentication

```env
ARGON_SECRET_KEY="your-secret-key-for-password-hashing"
COOKIE_SECRETS="secret1,secret2,secret3"
SUPER_ADMIN_EMAIL="admin@example.com"
SUPER_ADMIN_PASSWORD="secure-password"
```

### Email (SMTP)

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USERNAME="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="noreply@yourchurch.com"
```

### SMS (Letexto)

```env
LETEXTO_API_URL="https://api.letexto.com"
LETEXTO_API_TOKEN="your-letexto-token"
MESSAGE_SENDER_ID="YourChurch"
```

### Quirrel (Background Jobs)

```env
QUIRREL_TOKEN="your-quirrel-token"
QUIRREL_BASE_URL="http://localhost:3000"
ATTENDANCE_CONFLICTS_INTERVAL="3600000"  # 1 hour in ms
REPORT_TRACKING_CRON="0 9 * * 1"  # Every Monday at 9 AM
BIRTHDAYS_CRON="0 8 * * 1"  # Every Monday at 8 AM
```

### MinIO (File Storage)

```env
MINIO_HOST="localhost"
MINIO_PORT="9000"
MINIO_BUCKET="church-files"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_USE_SSL="false"
```

## Development

### Start Development Server

Start both Remix dev server and Quirrel job scheduler:

```bash
pnpm dev
```

This runs:

- Remix dev server with HMR
- Express server in watch mode
- Quirrel job scheduler

### Start Individual Services

Start only Remix:

```bash
pnpm dev:remix
```

Start only server build watcher:

```bash
pnpm dev:server
```

Start only Quirrel:

```bash
pnpm quirrel
```

### Code Quality

Run linter:

```bash
pnpm lint
```

Type checking:

```bash
pnpm typecheck
```

Format code:

```bash
pnpm format
```

## Database Management

### Migrations

Create a new migration:

```bash
pnpm migration:create <migration-name>
```

Push schema changes (development):

```bash
pnpm db:push
```

Deploy migrations (production):

```bash
pnpm db:deploy
```

### Database Reset

Reset database and apply all migrations:

```bash
pnpm db:setup
```

### Seeding

Seed development database with super admin:

```bash
pnpm db:seed
```

Run production seed script:

```bash
pnpm seed:prod
```

### Generate Prisma Client

After schema changes:

```bash
pnpm db:generate
```

## Background Jobs

Background jobs are managed by Quirrel and defined in `app/queues/`:

### Available Queues

1. **Birthdays Queue** (`app/queues/birthdays/`)

   - Weekly birthday notifications
   - Daily birthday SMS messages
   - Configured via `BIRTHDAYS_CRON`

2. **Attendance Conflicts Queue** (`app/queues/attendance-conflicts/`)

   - Periodic attendance conflict detection
   - Configured via `ATTENDANCE_CONFLICTS_INTERVAL`

3. **Report Tracking Queue** (`app/queues/report-tracking/`)

   - Weekly report tracking notifications
   - Configured via `REPORT_TRACKING_CRON`

4. **Notifications Queue** (`app/queues/notifications/`)
   - General notification dispatch

### Queue Routes

Queues are exposed as Remix routes under `/queues/` for Quirrel to invoke.

## Project Structure

```
jeriel/

```
