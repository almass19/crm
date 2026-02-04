# CRM System (MVP)

Web-based CRM system for managing clients and internal assignments with role-based access control.

## Tech Stack

- **Backend:** Node.js + TypeScript + NestJS
- **Database:** PostgreSQL
- **ORM:** Prisma v5
- **Frontend:** Next.js 14 (TypeScript, App Router)
- **UI:** Tailwind CSS
- **Auth:** JWT (access token, stateless)

### Why JWT?

JWT was chosen over sessions for simplicity in the MVP: no server-side session store is needed, the frontend stores the token in localStorage and sends it as a Bearer header. For production, consider adding refresh tokens and httpOnly cookies.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ (running locally or via Docker)

## Setup

### 1. PostgreSQL

#### Option A: Local PostgreSQL (Homebrew / macOS)

If PostgreSQL was installed via Homebrew, it typically creates a DB role matching your macOS username (e.g. `almas`). You can verify with:

```bash
psql postgres          # connects as your OS user
# You should see: postgres=>
```

Create the project database:

```bash
createdb crm_db
# or explicitly:
psql -d postgres -c "CREATE DATABASE crm_db;"
```

> **Note:** If your local Postgres uses a different user or requires a password, adjust `DATABASE_URL` in `backend/.env` accordingly.

#### Option B: Docker

If you prefer an isolated setup (no local password/user issues):

```bash
docker compose up -d
```

This starts PostgreSQL on port 5432 with user `almas`, password `almas`, database `crm_db` (configured in `docker-compose.yml`).

### 2. Configure DATABASE_URL

Edit `backend/.env` and set your connection string:

```env
# Local Postgres (no password):
DATABASE_URL="postgresql://almas@localhost:5432/crm_db?schema=public"

# Local Postgres (with password):
DATABASE_URL="postgresql://almas:YOUR_PASSWORD@localhost:5432/crm_db?schema=public"

# Docker:
DATABASE_URL="postgresql://almas:almas@localhost:5432/crm_db?schema=public"
```

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed the database with test users
npx prisma db seed

# Start the backend (dev mode)
npm run start:dev
```

Backend runs on http://localhost:3001

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the frontend (dev mode)
npm run dev
```

Frontend runs on http://localhost:3000

## Test Accounts

| Role             | Email            | Password    |
|------------------|------------------|-------------|
| Project Manager  | pm@crm.local     | password123 |
| Sales Manager    | sales@crm.local  | password123 |
| Specialist 1     | spec1@crm.local  | password123 |
| Specialist 2     | spec2@crm.local  | password123 |

## User Roles

### Sales Manager (Менеджер по продажам)
- Creates new client records
- Views all clients and their statuses
- Cannot assign specialists or delete clients

### Project Manager (Проект-менеджер)
- Views all clients
- Assigns specialists to clients
- Changes client status (NEW → ASSIGNED → IN_WORK → DONE / REJECTED)
- Can reassign specialists and archive clients
- All assignments are stored in history

### Specialist (Специалист)
- Sees only clients assigned to them
- New assignments appear in "Новые клиенты" tab
- Must click "Принять в работу" to acknowledge assignment
- Can add comments and internal notes

## API Endpoints

| Method | Path                          | Description           | Access          |
|--------|-------------------------------|-----------------------|-----------------|
| POST   | /api/auth/login               | Login                 | Public          |
| GET    | /api/auth/me                  | Get current user      | Authenticated   |
| GET    | /api/users?role=specialist    | List specialists      | PM only         |
| POST   | /api/clients                  | Create client         | Sales Manager   |
| GET    | /api/clients                  | List clients          | Authenticated   |
| GET    | /api/clients/:id              | Get client details    | Authenticated   |
| PATCH  | /api/clients/:id              | Update client         | Authenticated   |
| PATCH  | /api/clients/:id/archive      | Archive client        | PM only         |
| POST   | /api/clients/:id/assign       | Assign specialist     | PM only         |
| POST   | /api/clients/:id/acknowledge  | Acknowledge assignment| Specialist only |
| POST   | /api/clients/:id/comments     | Add comment           | Authenticated   |
| GET    | /api/clients/:id/comments     | List comments         | Authenticated   |

## Project Structure

```
crm-system/
├── backend/
│   ├── src/
│   │   ├── common/
│   │   │   ├── decorators/    # @Roles, @CurrentUser
│   │   │   └── guards/        # RolesGuard
│   │   ├── modules/
│   │   │   ├── auth/          # JWT auth, login, strategy
│   │   │   ├── users/         # User listing
│   │   │   ├── clients/       # CRUD, assign, acknowledge
│   │   │   ├── comments/      # Client comments
│   │   │   └── audit/         # Audit logging
│   │   └── prisma/            # PrismaService (global)
│   └── prisma/
│       ├── schema.prisma      # Database schema
│       └── seed.ts            # Seed data
├── frontend/
│   ├── app/
│   │   ├── login/             # Login page
│   │   ├── clients/           # Client list
│   │   └── clients/[id]/      # Client details
│   ├── components/            # Shared components
│   └── lib/                   # API client, auth context
├── docker-compose.yml
└── README.md
```
