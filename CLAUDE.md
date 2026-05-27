# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Project Overview

This is a church management system built with Remix, designed to manage members,
tribes, departments, honor families, attendance tracking, and notifications. The
application uses PostgreSQL via Prisma ORM, with background jobs powered by
BullMQ with Redis, and file storage via MinIO.

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
pnpm dev                        # Start dev server (runs both remix and server in parallel)
pnpm dev:remix                  # Start only Remix dev server
pnpm dev:server                 # Build and watch server in dev mode
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

This project uses **remix-flat-routes** for file-based routing. Routes are
organized in `app/routes/` with the following conventions:

- **Pathless layouts**: `_dashboard/` creates a layout without adding to the URL
  path
- **Dynamic segments**: `tribes.($id)/` creates routes with optional parameters
- **Nested routes**: Files in subdirectories create child routes **Standard
  route structure** (`app/routes/_dashboard/feature/`):

```text
feature/
├── _index.tsx              # Main component
├── schema.ts               # Zod validation schemas
├── types.ts                # TypeScript types
├── constants.ts            # Route-level constants
├── components/             # Route-specific UI components
├── utils/
│   └── utils.server.ts     # Route-specific server utilities
└── server/
    ├── loader.server.ts    # Data loading
    └── action.server.ts    # Form actions & mutations
```

**Complex feature layout** (entities with detail pages, e.g.
`app/routes/_dashboard/entity.($id)/`):

```text
entity.($id)/
├── _index.tsx
├── schema.ts
├── server/
│   ├── loader/
│   │   └── loader.server.ts
│   └── actions/
│       ├── action.server.ts        # Route entry point (intent routing)
│       ├── handler.server.ts       # Transaction orchestration
│       ├── member-operations.ts    # Member-specific DB operations
│       └── manager-operations.ts  # Manager role DB operations
└── utils/
    └── utils.server.ts
```

**Examples**:

- `app/routes/_dashboard/tribes.($id)/_index.tsx` → `/dashboard/tribes` or
  `/dashboard/tribes/:id`
- `app/routes/_auth+/login/_index.tsx` → `/login`
- `app/routes/api/mark-attendance/_index.ts` → `/api/mark-attendance`

### Authentication System

Authentication is handled via **remix-auth** with form-based strategy:

- **Session management**: Uses encrypted cookies via
  `app/utils/session.server.ts`
- **Password hashing**: Argon2 with secret key from env (`ARGON_SECRET_KEY`)
- **Auth utilities** in `app/utils/auth.server.ts` (not `app/helpers/`):
  - `requireUser(request)` - Ensures user is authenticated, returns typed `User`
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

Database access is centralized in
`app/infrastructures/database/prisma.server.ts` with custom Prisma extensions:

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
import { prisma } from '~/infrastructures/database/prisma.server'

// Use Prisma client normally
const users = await prisma.user.findMany()

// Use custom extensions
const user = await prisma.user.verifyLogin(email, password)
```

### Background Jobs

**Current Implementation**: BullMQ with Redis

Background jobs are powered by **BullMQ** with Redis. Jobs are defined in
`app/queues/`:

**Queue Structure**:

- Each queue uses BullMQ's Queue, Worker, and QueueEvents
- Queue definitions live in `app/queues/<queue-name>/`
- Queue registration helper: `app/helpers/queue.ts`
- Each queue has:
  - `*.processor.ts` - Job processing logic
  - `*.server.ts` - Queue registration and job enqueuing functions

**Available Queues**:

- `birthdays` - Weekly birthday notifications and daily birthday SMS
- `attendance-conflicts` - Periodic check for attendance conflicts
- `report-tracking` - Weekly report tracking notifications
- `notifications` - Notification dispatch queue

**BullMQ Configuration**:

- **Queue Registration**: `app/helpers/queue.ts` - Custom helper using BullMQ
  Queue, Worker, and QueueEvents
- **Redis Client**: `app/infrastructures/cache/redis.server.ts` - Redis
  connection singleton
- **Job Configuration**: Default 3 retry attempts with exponential backoff,
  automatic cleanup of completed/failed jobs
- **Logging**: Winston logger integration for queue events

**Cron Configuration** (via `.env`):

- `CHECK_CONFLICT_PATTERN` - Cron pattern for checking attendance conflicts
  (cron expression)
- `CHECK_ATTENDANCE_CONFLICT_CRON` - Attendance conflict check schedule (cron
  expression)
- `REPORT_TRACKING_CRON` - Report tracking schedule (cron expression)
- `BIRTHDAYS_CRON` - Birthday notification schedule (cron expression)

### Message Sending

SMS sending is handled via Letexto API:

- **Configuration**: Set `LETEXTO_API_TOKEN` and `LETEXTO_API_URL` in `.env`
- **Sender ID**: Configure `MESSAGE_SENDER_ID`
- **Utilities**: `app/shared/message-sender.server.ts` contains SMS sending
  logic
- **Email**: Uses nodemailer via `app/helpers/mailer.server.ts` with SMTP config

### File Storage (MinIO)

File uploads are handled via MinIO (S3-compatible storage):

- **Configuration**: Set MinIO environment variables in `.env`
- **Utilities**:
  - `app/infrastructures/storage/minio.server.ts` - MinIO client setup
  - `app/helpers/member-picture.server.ts` - Member photo handling

### Shared Code Organization

- `app/components/` - Reusable UI components (layout, forms, toolbar, stats, UI
  primitives)
- `app/helpers/` - Server-side cross-cutting helpers (never import in client
  code)
  - `app/helpers/attendance.server.ts` - Attendance data fetching & computation:
    `buildMembersWithAttendances`, `parseExportDateRanges`,
    `fetchAttendanceData`, `prepareDateRanges`, `getMemberQuery`,
    `getDateFilterOptions`, `formatOptions`
  - `app/helpers/integration.server.ts` - Member integration date management:
    `updateIntegrationDates`, `fetchEntityMemberIds`, `hashPassword`
  - `app/helpers/notification.server.ts` - Notification dispatch helpers
  - `app/helpers/member-upload.server.ts` - Bulk member upload orchestration
  - `app/helpers/process-members-upload.server.ts` - Excel/CSV parsing for
    member uploads
  - `app/helpers/member-picture.server.ts` - Member photo upload & retrieval
  - `app/helpers/birthdays.server.ts` - Birthday notification logic
  - `app/helpers/mailer.server.ts` - Email sending via nodemailer/SMTP
  - `app/helpers/queue.ts` - BullMQ queue registration helper
  - `app/helpers/logging.ts` - Winston logger setup
  - `app/helpers/session.ts` - Session management helpers
  - `app/helpers/storage.ts` - File storage helpers
  - `app/helpers/cron-scheduler.ts` - Cron job scheduling helpers
- `app/infrastructures/` - Infrastructure layer (clients & singletons)
  - `app/infrastructures/database/prisma.server.ts` - Prisma client with custom
    extensions (`createUser`, `resetPassword`, `verifyLogin`, `hidePassword`)
  - `app/infrastructures/cache/redis.server.ts` - Redis connection singleton
  - `app/infrastructures/storage/minio.server.ts` - MinIO client setup
- `app/shared/` - Shared utilities and constants (client + server)
  - `app/shared/validation.server.ts` - Shared Zod validation helpers:
    `checkEmailUniqueness`, `addEmailUniquenessIssue` — use these instead of
    duplicating email-uniqueness checks in route actions
  - `app/shared/attendance.ts` - Pure attendance computation
    (`getMembersAttendances`)
  - `app/shared/schema.ts` - Shared Zod schemas (e.g.
    `createEntityMemberSchema`)
  - `app/shared/enum.ts` - Shared enums (e.g. `MemberStatus`)
  - `app/shared/types.ts` - Shared TypeScript types
  - `app/shared/constants.ts` - Shared constants
  - `app/shared/forms/` - Shared form field components
  - `app/shared/member-table/` - Shared member table components
  - `app/shared/hooks/` - Shared React hooks
  - `app/shared/menus-links.ts` - Navigation menu configuration
  - `app/shared/message-sender.server.ts` - SMS/message sending utilities
  - `app/shared/mocks/` - Test/dev mock data
- `app/models/` - TypeScript domain model interfaces
- `app/hooks/` - Shared React hooks
- `app/utils/` - Pure utility functions and server auth
  - `app/utils/auth.server.ts` - `requireUser`, `requireRole`, `logout`, etc.
  - `app/utils/session.server.ts` - Cookie session management
  - `app/utils/date.ts` - Date utilities (`getMonthSundays`, `normalizeDate`)
  - `app/utils/excel.server.ts` - Excel file generation

### API Routes

API routes are in `app/routes/api/` and follow REST conventions. They return
JSON responses and are used for:

- Member data fetching
- Attendance marking
- Statistics retrieval
- Birthday notifications
- Conflict resolution

## Environment Variables

Critical environment variables (see `.env.example` for complete list):

**Database**:

- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - Database
  connection parameters
- `DATABASE_URL` - PostgreSQL connection string (can reference above variables)

**Authentication**:

- `ARGON_SECRET_KEY` - Password hashing secret (generate with
  `openssl rand -hex 16`)
- `COOKIE_SECRETS` - Session cookie secrets, comma-separated (generate with
  `openssl rand -hex 32`)
- `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` - Initial super admin credentials

**Email (SMTP)**:

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD` - SMTP server
  configuration
- `SMTP_FROM`, `SMTP_FROM_NAME` - Email sender details
- For local development: Use MailPit (localhost:1025, web UI at localhost:8025)

**SMS (Letexto)**:

- `LETEXTO_API_URL` - Letexto API endpoint
- `LETEXTO_API_TOKEN` - Letexto generated API key token
- `MESSAGE_SENDER_ID` - SMS sender identifier

**Background Jobs (BullMQ with Redis)**:

- `REDIS_HOST` - Redis server host (default: localhost)
- `REDIS_PORT` - Redis server port (default: 6379)
- `REDIS_PASSWORD` - Redis password (optional)
- `REDIS_URL` - Full Redis connection URL (optional, overrides HOST/PORT)
- `CHECK_CONFLICT_PATTERN` - Cron pattern for attendance conflicts (e.g.,
  `'*/1 * * * *'`)
- `CHECK_ATTENDANCE_CONFLICT_CRON` - Attendance conflict check schedule (e.g.,
  `"0 8 * * 1-6"`)
- `REPORT_TRACKING_CRON` - Report tracking schedule (e.g., `"0 8 * * 1-6"`)
- `BIRTHDAYS_CRON` - Birthday notification schedule (e.g., `"0 8 * * *"`)

**MinIO** (S3-compatible object storage):

- `MINIO_URL` - MinIO server URL (e.g., http://localhost:9000)
- `MINIO_HOST`, `MINIO_PORT` - MinIO server connection
- `MINIO_BUCKET` - Storage bucket name
- `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY` - MinIO credentials (generate from
  console)

**Features**:

- `ENABLE_TRACKING_CLEANUP` - Enable cleanup of old tracking entries older than
  6 months (true/false)

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
- **Jobs**: BullMQ with Redis for background jobs
- **Logging**: Winston with daily rotate file transport
- **Tables**: TanStack Table v8
- **Charts**: Recharts
- **Icons**: Remix Icon, Lucide React
- **Email**: React Email with nodemailer
- **Storage**: MinIO client
- **Utilities**: date-fns, xlsx, framer-motion

## Code Quality Standards

This codebase follows strict clean-code conventions. All contributors and AI
assistants must adhere to these rules.

### Function Size & Responsibility

- **Maximum ~15–20 lines per function** — if a function exceeds this, extract
  helpers
- **Single responsibility** — each function does exactly ONE thing; its name
  describes that one thing
- **Orchestrator pattern** — complex operations use a thin top-level function
  that delegates to focused sub-functions

### Avoid Duplication — Use Shared Helpers

Before writing a new utility, check whether it already exists in `app/helpers/`
or `app/shared/`:

| Need                                           | Use                                                            |
| ---------------------------------------------- | -------------------------------------------------------------- |
| Build member attendance data for a page/export | `buildMembersWithAttendances` in `~/helpers/attendance.server` |
| Parse `from`/`to` date strings for exports     | `parseExportDateRanges` in `~/helpers/attendance.server`       |
| Validate email uniqueness in a Zod schema      | `addEmailUniquenessIssue` in `~/shared/validation.server`      |
| Hash a password                                | `hashPassword` in `~/helpers/integration.server`               |
| Fetch member IDs for an entity                 | `fetchEntityMemberIds` in `~/helpers/integration.server`       |

### Parallelizing Database Queries

Independent Prisma queries must run in parallel with `Promise.all`:

```typescript
// ✅ Correct
const [members, count] = await Promise.all([
	prisma.user.findMany({ where }),
	prisma.user.count({ where }),
])

// ❌ Wrong — sequential, wasted latency
const members = await prisma.user.findMany({ where })
const count = await prisma.user.count({ where })
```

### TypeScript Strictness

- **No `any` in new code** — use proper types or `unknown`
- After `invariant(obj.field)`, TypeScript may not narrow the parent object —
  use explicit type assertions or restructure instead of adding `any`
- The `as unknown as Prisma.TransactionClient` cast in BullMQ-extended Prisma
  contexts is a known limitation; do not remove it

### Validation in Route Actions

Use `parseWithZod` + `superRefine` with `addEmailUniquenessIssue` for all member
create/edit forms:

```typescript
import { addEmailUniquenessIssue } from '~/shared/validation.server'

const submission = await parseWithZod(formData, {
	schema: mySchema.superRefine((fields, ctx) =>
		addEmailUniquenessIssue(fields, ctx, existingMemberId),
	),
	async: true,
})
```

---

## Testing

Testing infrastructure is set up with Vitest:

- Configuration: `vitest` dev dependency installed
- Test files: Use `.test.ts` or `.spec.ts` extensions
- Run tests: `vitest` (no dedicated npm script currently in package.json)

## Deployment Notes

- **Node version**: >= 20 (specified in package.json engines)
- **Package manager**: pnpm 10.25.0
- **Build output**: `build/` directory
- **Server**: Custom Express server (`server.ts`) with Remix integration
- **Docker**: Dockerfile and compose.yml included for containerized deployment
- **Services Required**: PostgreSQL, Redis, MinIO, SMTP server (or MailPit for
  dev)
