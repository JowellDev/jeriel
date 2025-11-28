# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a church management system built with Remix, designed to manage members, tribes, departments, honor families, attendance tracking, and notifications. The application uses PostgreSQL via Prisma ORM, with background jobs handled by Quirrel (migrating to BullMQ with Redis), and file storage via MinIO.

## Development Commands

### Setup and Installation
```bash
pnpm install                    # Install dependencies
pnpm db:setup                   # Reset database and apply migrations
pnpm db:generate                # Generate Prisma client
pnpm db:seed                    # Seed database with super admin
```

### Development
```bash
pnpm dev                        # Start dev server with Quirrel (runs both remix and quirrel)
pnpm dev:remix                  # Start only Remix dev server
pnpm dev:server                 # Build and watch server in dev mode
pnpm quirrel                    # Run Quirrel job scheduler
```

### Building and Running
```bash
pnpm build                      # Build both remix and server
pnpm build:remix                # Build Remix app only
pnpm build:server               # Build Express server only
pnpm start                      # Start production server
```

### Code Quality
```bash
pnpm lint                       # Run ESLint
pnpm typecheck                  # Run TypeScript type checking
pnpm format                     # Format code with Prettier
```

### Database Management
```bash
pnpm migration:create <name>    # Create a new migration
pnpm db:push                    # Push schema changes without migration
pnpm db:deploy                  # Deploy migrations (production)
pnpm seed:prod                  # Run production seed script
```

## Architecture

### Routing Structure

This project uses **remix-flat-routes** for file-based routing. Routes are organized in `app/routes/` with the following conventions:

- **Pathless layouts**: `_dashboard/` creates a layout without adding to the URL path
- **Dynamic segments**: `tribes.($id)/` creates routes with optional parameters
- **Nested routes**: Files in subdirectories create child routes
- **Route modules**: Each route folder typically contains:
  - `_index.tsx` - Main component
  - `loader.server.ts` - Server-side data loading
  - `action.server.ts` - Form actions and mutations
  - `schema.ts` - Zod validation schemas
  - `types.ts` - TypeScript types
  - `constants.ts` - Route-specific constants
  - `components/` - Route-specific components
  - `utils/` - Route-specific utilities

**Examples**:
- `app/routes/_dashboard/tribes.($id)/_index.tsx` → `/dashboard/tribes` or `/dashboard/tribes/:id`
- `app/routes/_auth+/login/_index.tsx` → `/login`
- `app/routes/api/mark-attendance/_index.ts` → `/api/mark-attendance`

### Authentication System

Authentication is handled via **remix-auth** with form-based strategy:

- **Session management**: Uses encrypted cookies via `app/utils/session.server.ts`
- **Password hashing**: Argon2 with secret key from env (`ARGON_SECRET_KEY`)
- **Auth utilities** in `app/utils/auth.server.ts`:
  - `requireUser(request)` - Ensures user is authenticated
  - `requireRole(request, roles)` - Ensures user has required role
  - `requireAnonymous(request)` - Redirects authenticated users
  - `getUserId(request)` - Gets current user ID
  - `logout(request)` - Handles logout

**Roles** (defined in Prisma schema):
- `SUPER_ADMIN` - Full system access
- `ADMIN` - Church administrator
- `TRIBE_MANAGER` - Manages a tribe
- `DEPARTMENT_MANAGER` - Manages a department
- `HONOR_FAMILY_MANAGER` - Manages a honor family
- `MEMBER` - Regular member

### Database Layer (Prisma)

Database access is centralized in `app/utils/db.server.ts` with custom Prisma extensions:

**Custom Extensions**:
- `createUser` - Creates user with hashed password
- `resetPassword` - Resets user password
- `verifyLogin` - Authenticates user credentials
- `hidePassword` - Prevents password hash from being exposed

**Key Models**:
- `User` - Members and administrators
- `Church` - Church entities
- `Tribe` - Tribal groups
- `Department` - Department groups
- `HonorFamily` - Honor family groups
- `Attendance` - Member attendance records
- `AttendanceReport` - Aggregated attendance reports
- `Notification` - System notifications
- `Message` - SMS/Email messages

**Accessing Prisma**:
```typescript
import { prisma } from '~/utils/db.server'

// Use Prisma client normally
const users = await prisma.user.findMany()

// Use custom extensions
const user = await prisma.user.verifyLogin(email, password)
```

### Background Jobs

**Current Implementation**: Quirrel (migrating to BullMQ with Redis)

Background jobs are defined in `app/queues/` and registered as Remix routes:

**Queue Structure**:
- Each queue is currently a Quirrel Queue instance
- Queue definitions live in `app/queues/<queue-name>/*.server.ts`
- Queue routes are exposed via `app/routes/queues/<queue-name>.ts`

**Available Queues**:
- `birthdays` - Weekly birthday notifications and daily birthday SMS
- `attendance-conflicts` - Periodic check for attendance conflicts
- `report-tracking` - Weekly report tracking notifications
- `notifications` - Notification dispatch queue

**Cron Configuration** (via `.env`):
- `CHECK_CONFLICT_PATTERN` - Cron pattern for checking attendance conflicts (cron expression)
- `CHECK_ATTENDANCE_CONFLICT_CRON` - Attendance conflict check schedule (cron expression)
- `REPORT_TRACKING_CRON` - Report tracking schedule (cron expression)
- `BIRTHDAYS_CRON` - Birthday notification schedule (cron expression)

**Migration to BullMQ**:
- `bullmq` package has been added as a dependency
- Redis infrastructure is being prepared (see REDIS environment variables)
- Migration is in progress on the `bullmq-setup` branch

### Message Sending

SMS sending is handled via Letexto API:

- **Configuration**: Set `LETEXTO_API_TOKEN` and `LETEXTO_API_URL` in `.env`
- **Sender ID**: Configure `MESSAGE_SENDER_ID`
- **Utilities**: `app/shared/message-sender.server.ts` contains SMS sending logic
- **Email**: Uses nodemailer via `app/utils/mailer.server.ts` with SMTP config

### File Storage (MinIO)

File uploads are handled via MinIO (S3-compatible storage):

- **Configuration**: Set MinIO environment variables in `.env`
- **Utilities**:
  - `app/utils/minio.server.ts` - MinIO client setup
  - `app/utils/upload.server.ts` - File upload handling
  - `app/utils/member-picture.server.ts` - Member photo handling

### Shared Code Organization

- `app/components/` - Reusable UI components (layout, forms, toolbar, stats, UI primitives)
- `app/shared/` - Shared utilities and constants across routes
  - `app/shared/forms/` - Shared form schemas
  - `app/shared/attendance.ts` - Attendance utilities
  - `app/shared/menus-links.ts` - Navigation menu configuration
  - `app/shared/message-sender.server.ts` - Message sending utilities
- `app/utils/` - General utility functions
- `app/models/` - Domain models
- `app/hooks/` - Shared React hooks

### API Routes

API routes are in `app/routes/api/` and follow REST conventions. They return JSON responses and are used for:
- Member data fetching
- Attendance marking
- Statistics retrieval
- Birthday notifications
- Conflict resolution

## Environment Variables

Critical environment variables (see `.env.example` for complete list):

**Database**:
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - Database connection parameters
- `DATABASE_URL` - PostgreSQL connection string (can reference above variables)

**Authentication**:
- `ARGON_SECRET_KEY` - Password hashing secret (generate with `openssl rand -hex 16`)
- `COOKIE_SECRETS` - Session cookie secrets, comma-separated (generate with `openssl rand -hex 32`)
- `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` - Initial super admin credentials

**Email (SMTP)**:
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD` - SMTP server configuration
- `SMTP_FROM`, `SMTP_FROM_NAME` - Email sender details
- For local development: Use MailPit (localhost:1025, web UI at localhost:8025)

**SMS (Letexto)**:
- `LETEXTO_API_URL` - Letexto API endpoint
- `LETEXTO_API_TOKEN` - Letexto generated API key token
- `MESSAGE_SENDER_ID` - SMS sender identifier

**Background Jobs**:
- `QUIRREL_TOKEN`, `QUIRREL_BASE_URL` - Quirrel configuration (current)
- `CHECK_CONFLICT_PATTERN` - Cron pattern for attendance conflicts (e.g., `'*/1 * * * *'`)
- `CHECK_ATTENDANCE_CONFLICT_CRON` - Attendance conflict check schedule (e.g., `"0 8 * * 1-6"`)
- `REPORT_TRACKING_CRON` - Report tracking schedule (e.g., `"0 8 * * 1-6"`)
- `BIRTHDAYS_CRON` - Birthday notification schedule (e.g., `"0 8 * * *"`)

**Redis** (for future BullMQ migration):
- `REDIS_HOST` - Redis server host (default: localhost)
- `REDIS_PORT` - Redis server port (default: 6379)

**MinIO** (S3-compatible object storage):
- `MINIO_URL` - MinIO server URL (e.g., http://localhost:9000)
- `MINIO_HOST`, `MINIO_PORT` - MinIO server connection
- `MINIO_BUCKET` - Storage bucket name
- `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY` - MinIO credentials (generate from console)

**Features**:
- `ENABLE_TRACKING_CLEANUP` - Enable cleanup of old tracking entries older than 6 months (true/false)

## Path Aliases

TypeScript path aliases configured in `tsconfig.json`:
- `~/` → `app/`
- `~/api/` → `app/routes/api/`

## Key Dependencies

- **Framework**: Remix v2 with React 18
- **Database**: Prisma with PostgreSQL
- **UI**: Radix UI, Tailwind CSS, DaisyUI, shadcn/ui components
- **Forms**: Conform with Zod validation
- **Auth**: remix-auth with form strategy
- **Jobs**: Quirrel for background jobs and cron (migrating to BullMQ + Redis)
- **Tables**: TanStack Table v8
- **Charts**: Recharts
- **Icons**: Remix Icon, Lucide React
- **Email**: React Email with nodemailer
- **Storage**: MinIO client
- **Utilities**: date-fns, xlsx, framer-motion

## Testing

Testing infrastructure is set up with Vitest:
- Configuration: `vitest` dev dependency installed
- Test files: Use `.test.ts` or `.spec.ts` extensions
- Run tests: `vitest` (no dedicated npm script currently in package.json)

## Deployment Notes

- **Node version**: >= 20 (specified in package.json engines)
- **Package manager**: pnpm 10.24.0
- **Build output**: `build/` directory
- **Server**: Custom Express server (`server.ts`) with Remix integration
- **Docker**: Dockerfile and compose.yml included for containerized deployment
- **Services Required**: PostgreSQL, MinIO, Redis (when BullMQ migration completes), SMTP server (or MailPit for dev)
