<div align="center">
  <img src="public/images/green-logo-vh.png" alt="Jeriel Logo" width="200"/>

# Jeriel - Church Management System

**A comprehensive church management system built with Remix**

Streamline church operations including member management, attendance tracking,
tribal organization, and automated notifications.

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20-green.svg)](https://nodejs.org/)
[![Remix](https://img.shields.io/badge/Remix-v2-blue.svg)](https://remix.run/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue.svg)](https://www.postgresql.org/)

</div>

---

## Features

### Core Functionality

- **Member Management** - Profiles with photos, contact info, and role
  assignment
- **Organizational Structure** - Tribes, departments, and honor families
  management
- **Attendance Tracking** - Digital attendance with conflict detection and
  reporting
- **Automated Notifications** - Birthday reminders, attendance alerts, and
  report tracking
- **Messaging** - SMS (Letexto) and email capabilities
- **Analytics & Reports** - Dashboards with export functionality (Excel, PDF)
- **Role-Based Access** - Granular permissions (Super Admin, Admin, Managers,
  Members)

### Automation

- Weekly birthday notifications | Daily birthday SMS
- Attendance conflict detection | Weekly report tracking
- Automated attendance report generation

---

## Tech Stack

**Frontend:** Remix v2 • React 18 • Tailwind CSS • DaisyUI • Radix UI •
shadcn/ui • TanStack Table • Recharts

**Backend:** Node.js (≥20) • Express • PostgreSQL • Prisma ORM • Quirrel (jobs)
• MinIO (S3-compatible storage)

**Auth:** remix-auth • Argon2 password hashing • Encrypted cookies

**Tools:** TypeScript • Vitest • ESLint • Prettier • pnpm 10.20.0

---

## Quick Start

### Prerequisites

- Node.js ≥ 20.0.0
- pnpm ≥ 10.20.0
- PostgreSQL database
- MinIO server (for file storage)

### Installation

```bash
# Clone and install
git clone <repository-url>
cd jeriel
pnpm install

# Setup database
pnpm db:setup
pnpm db:seed

# Start development
pnpm dev
```

---

## Environment Configuration

Create a `.env` file (see `.env.example`):

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/jeriel"

# Authentication
ARGON_SECRET_KEY="your-secret-key"
COOKIE_SECRETS="secret1,secret2,secret3"
SUPER_ADMIN_EMAIL="admin@example.com"
SUPER_ADMIN_PASSWORD="secure-password"

# Email (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USERNAME="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="noreply@yourchurch.com"

# SMS (Letexto)
LETEXTO_API_URL="https://api.letexto.com"
LETEXTO_API_TOKEN="your-token"
MESSAGE_SENDER_ID="YourChurch"

# Background Jobs (Quirrel)
QUIRREL_TOKEN="your-quirrel-token"
QUIRREL_BASE_URL="http://localhost:3000"
ATTENDANCE_CONFLICTS_INTERVAL="3600000"  # 1 hour
REPORT_TRACKING_CRON="0 9 * * 1"  # Monday 9 AM
BIRTHDAYS_CRON="0 8 * * 1"  # Monday 8 AM

# MinIO Storage
MINIO_HOST="localhost"
MINIO_PORT="9000"
MINIO_BUCKET="church-files"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_USE_SSL="false"
```

---

## Development Commands

| Command          | Description                        |
| ---------------- | ---------------------------------- |
| `pnpm dev`       | Start dev server (Remix + Quirrel) |
| `pnpm build`     | Build for production               |
| `pnpm start`     | Start production server            |
| `pnpm lint`      | Run ESLint                         |
| `pnpm typecheck` | TypeScript type checking           |
| `pnpm format`    | Format with Prettier               |

### Database

| Command                        | Description                   |
| ------------------------------ | ----------------------------- |
| `pnpm db:setup`                | Reset DB and apply migrations |
| `pnpm db:seed`                 | Seed with super admin         |
| `pnpm migration:create <name>` | Create new migration          |
| `pnpm db:push`                 | Push schema (dev)             |
| `pnpm db:deploy`               | Deploy migrations (prod)      |

---

## Project Structure

```
jeriel/
├── app/
│   ├── routes/              # Remix routes (remix-flat-routes)
│   │   ├── _dashboard/      # Dashboard layout
│   │   ├── _auth+/          # Auth routes
│   │   ├── api/             # API endpoints
│   │   └── queues/          # Quirrel job routes
│   ├── components/          # Reusable UI components
│   ├── queues/              # Background job definitions
│   ├── shared/              # Shared utilities & constants
│   ├── utils/               # Auth, DB, session, upload, mailer
│   └── hooks/               # React hooks
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── migrations/          # DB migrations
├── public/                  # Static assets
├── server.ts                # Express server
└── .env                     # Environment variables
```

### Routing Convention (remix-flat-routes)

- `_dashboard/` - Pathless layout (no URL segment)
- `tribes.($id)/` - Dynamic/optional parameters
- `_index.tsx` - Index route for the folder

**Route Structure:**

```
app/routes/feature/
├── _index.tsx           # Main component
├── loader.server.ts     # Data loading
├── action.server.ts     # Form actions
├── schema.ts            # Zod schemas
└── components/          # Feature components
```

---

## Authentication & Roles

**Roles:**

- `SUPER_ADMIN` - Full system access
- `ADMIN` - Church administrator
- `TRIBE_MANAGER` / `DEPARTMENT_MANAGER` / `HONOR_FAMILY_MANAGER` - Group
  managers
- `MEMBER` - Regular member

**Auth Utilities** (`app/utils/auth.server.ts`):

```typescript
import {
	requireUser,
	requireRole,
	getUserId,
	logout,
} from '~/utils/auth.server'

const user = await requireUser(request)
await requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
const userId = await getUserId(request)
return await logout(request)
```

---

## Background Jobs (Quirrel)

Jobs are defined in `app/queues/` and exposed via routes:

1. **Birthdays** - Weekly notifications + daily SMS
2. **Attendance Conflicts** - Periodic conflict checks
3. **Report Tracking** - Weekly tracking notifications
4. **Notifications** - General notification dispatch

Configure via cron expressions in `.env`

---

## Deployment

### Production Build

```bash
pnpm build
pnpm start
```

### Docker

```bash
docker compose up -d
```

**Requirements:**

- Node.js ≥ 20
- PostgreSQL (accessible)
- MinIO or S3-compatible storage
- SMTP server
- Letexto API access

---

## Path Aliases

```typescript
import { prisma } from '~/infrastructures/database/prisma.server' // app/utils/db.server.ts
import { getMembers } from '~/api/members' // app/routes/api/members
```

- `~/` → `app/`
- `~/api/` → `app/routes/api/`

---

## Database Extensions (Prisma)

Custom extensions in `app/utils/db.server.ts`:

- `createUser` - Create user with hashed password
- `resetPassword` - Reset user password
- `verifyLogin` - Authenticate credentials
- `hidePassword` - Prevent password exposure

---

## File Storage

**MinIO Integration:**

- Member profile photos
- Document attachments
- File uploads

**Utilities:**

- `app/utils/minio.server.ts` - MinIO client
- `app/utils/upload.server.ts` - Upload handler
- `app/utils/member-picture.server.ts` - Member photos

---

## Key Dependencies

**Framework:** Remix, React, Express

**UI:** Radix UI, Tailwind CSS, DaisyUI, shadcn/ui, Recharts, Framer Motion

**Forms & Validation:** Conform, Zod

**Data:** Prisma, TanStack Table

**Auth:** remix-auth, Argon2

**Jobs:** Quirrel

**Utils:** date-fns, xlsx, react-email, nodemailer, MinIO client

---

## Support & License

For issues and questions, please contact the development team.

**License:** [Add your license here]
