# ExitPrep Ethiopia — MVP Monorepo

Mobile-first web platform for Ethiopian National University Exit Exam preparation and COC Competency Exam preparation.

---

## Architecture Overview

```
exitprep-ethiopia/
├── apps/
│   ├── web/        # Student portal (React + TypeScript + Tailwind CSS, port 5173)
│   ├── admin/      # Admin & staff portal (React + TypeScript + Tailwind CSS, port 5174)
│   └── api/        # Express API (Node.js + TypeScript, port 4000)
├── packages/
│   ├── database/   # Prisma ORM, PostgreSQL schema, migrations & seeders
│   └── shared/     # Shared TypeScript enums, interfaces & DTO contracts
├── docs/
│   └── IMPLEMENTATION_PLAN.md # Architecture, content rule & implementation phases
├── package.json    # Root monorepo workspace configuration
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

---

## Local Development Guide (Ubuntu)

### Step 1 — Check Prerequisites

Ensure Node.js 20+, pnpm 9+, and PostgreSQL 15+ are installed:

```bash
node --version
pnpm --version
psql --version
```

### Step 2 — Configure Environment Variables

```bash
cp .env.example .env
```

Set your local PostgreSQL connection in `.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/exitprep_dev?schema=public"
JWT_SECRET="super-secret-exitprep-jwt-key-for-dev-only-min32chars"
PORT=4000
```

### Step 3 — Install Dependencies

From the repository root:

```bash
pnpm install
```

### Step 4 — Validate Prisma Schema

```bash
pnpm --filter @exitprep/database exec prisma validate --schema prisma/schema.prisma
```

### Step 5 — Generate Prisma Client & Run Initial Migration

```bash
# Generate the type-safe Prisma Client
pnpm db:generate

# Apply the initial migration to your local PostgreSQL development database
pnpm --filter @exitprep/database exec prisma migrate dev --name init --schema prisma/schema.prisma

# Seed initial roles, categories, sample programs, and test accounts
pnpm db:seed
```

### Step 6 — Start Development Servers

```bash
pnpm dev
```

### Local Service Ports

| Application | Local URL | Description |
| :--- | :--- | :--- |
| **Public & Student Portal** | `http://localhost:5173` | Mobile-first student portal, free practice & payments |
| **Admin & Staff Portal** | `http://localhost:5174` | Role-based operations: verification, questions, audit |
| **Express API & Health** | `http://localhost:4000/health` | Backend API routes and health check |

---

## Seeded Test Accounts

| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Administrator** | `admin@exitprep.et` | `Admin@ExitPrep2026!` |
| **Payment Administrator** | `finance@exitprep.et` | `ExitPrep@2026!` |
| **Academic Reviewer** | `reviewer@exitprep.et` | `ExitPrep@2026!` |
| **Content Editor** | `editor@exitprep.et` | `ExitPrep@2026!` |
| **Graduating Student** | `student@exitprep.et` | `ExitPrep@2026!` |

---

## Core Content Principle

> **NO INVENTED CONTENT POLICY:**
> Curricula, blueprints, competency standards, and official questions must not be fabricated. Content must remain in DRAFT or PENDING_REVIEW state until formally verified by certified academic reviewers with citations against Ministry of Education blueprints or official occupational standards.
