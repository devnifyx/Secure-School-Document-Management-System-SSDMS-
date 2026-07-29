# Secure School Document Management System (SSDMS)

SSDMS is a school document management system built for handling sensitive academic
documents (lesson plans, assessments, reports, etc.) with encryption at rest, role-based
access control, department-based access control, an approval workflow, and full audit
logging.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Core Concepts](#core-concepts)
4. [Features](#features)
5. [Prerequisites](#prerequisites)
6. [Local Setup](#local-setup)
7. [Environment Variables](#environment-variables)
8. [Default Admin Account](#default-admin-account)
9. [Running the App](#running-the-app)
10. [Deployment](#deployment)
11. [Troubleshooting](#troubleshooting)

---

## Tech Stack

| Layer      | Technology                                                            |
|------------|------------------------------------------------------------------------|
| Backend    | Laravel 12 (PHP 8.2+), Laravel Sanctum (token auth)                   |
| Frontend   | React 18 + TypeScript, Vite, React Router                             |
| Database   | MySQL (via XAMPP in local dev)                                        |
| Security   | AES-256-CBC file encryption at rest, SHA-256 integrity hashing        |

---

## Project Structure

```
D:\SSDMS/
├── backend-laravel/        # Laravel 12 API (port 8000)
│   ├── app/
│   │   ├── Http/Controllers/   # AuthController, RegistrationController,
│   │   │                       # PanitiaController, UserController,
│   │   │                       # DocumentController, DashboardController,
│   │   │                       # AuditLogController, ...
│   │   ├── Http/Middleware/    # CheckUserActive, CheckPanitiaAccess
│   │   ├── Models/             # User, Panitia, Document, AuditLog, Notification
│   │   └── Helpers.php         # global logAudit() helper
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/            # DatabaseSeeder, PanitiaSeeder
│   └── routes/api.php          # all API routes
│
├── frontend/                # React + TypeScript + Vite SPA (port 5174)
│   ├── src/
│   │   ├── pages/               # Login, Register, PanitiaSelection,
│   │   │                        # AdminDashboard, TeacherDashboard,
│   │   │                        # DocumentUpload, DocumentRepository,
│   │   │                        # SearchDocuments, ApprovalQueue,
│   │   │                        # UserManagement, PanitiaManagement,
│   │   │                        # AuditLogs, Notifications, Settings
│   │   ├── components/          # Layout, ProtectedRoute, DocumentDetailsModal
│   │   ├── contexts/AuthContext.tsx
│   │   └── services/api.ts      # Axios instance (Bearer token + X-Active-Panitia)
│   └── vercel.json              # SPA rewrite + build config for Vercel
│
├── .gitignore
└── README.md
```

> Note: an earlier Node.js/Express backend prototype was removed from this repo.
> `backend-laravel/` is the only active backend.

---

## Core Concepts

### Roles (RBAC)
- **Admin** — manages users, Panitia (departments), approves/rejects documents and
  registrations, views audit logs, sees all documents system-wide.
- **Teacher** — registers, gets assigned to one or more Panitia, uploads documents
  scoped to their active Panitia, resubmits rejected documents.

### Panitia (Subject Departments) & DBAC
"Panitia" are subject departments (e.g. Bahasa Melayu, Mathematics, Science, ICT).
Teachers can belong to multiple Panitia via a `user_panitia` pivot table, with one
marked as their **primary** Panitia.

- On login, a Teacher with **one** Panitia is signed in directly. A Teacher with
  **multiple** Panitia is sent to a selection screen to choose their active Panitia
  for the session.
- The active Panitia is sent on every API request via the `X-Active-Panitia` header.
- **Department-Based Access Control (DBAC):** Teachers can only view, upload, and
  search documents belonging to their currently active Panitia. Admins are not
  restricted and see documents across all Panitia.
- Teachers can switch their active Panitia at any time from the topbar dropdown,
  which reloads the page to refresh all Panitia-scoped data.
- The `CheckPanitiaAccess` middleware validates the `X-Active-Panitia` header on every
  protected route: it passes Admins straight through, and for Teachers verifies the
  Panitia assignment is valid and active before allowing the request.

### Registration & Approval
New teachers self-register with name, email, username, password, and their primary
Panitia. New accounts start in `Pending` status and cannot log in until an Admin
approves them from the User Management page. Rejected accounts can be told why via
an admin-entered reason.

### Document Lifecycle
1. Teacher uploads a document (PDF, DOCX, DOC, JPG, PNG — max 10 MB) tagged with a
   category, tags, and their active Panitia.
2. The file is encrypted at rest with AES-256-CBC using a random key generated per
   document, and a SHA-256 hash of the original file is stored for integrity checks.
3. The document enters `Pending` status; Admins are notified and can Approve or
   Reject (rejection requires a reason).
4. Rejected documents can be edited and resubmitted by their owner, re-entering the
   Pending queue.
5. Admins can run an integrity **Verify** check at any time, comparing the stored hash
   against the current decrypted file to detect tampering or corruption.

### Audit Logging
Every significant action (login/logout, lockouts, Panitia selection/switching,
document upload/approve/reject/resubmit, user CRUD, Panitia CRUD, unauthorized
access attempts) is written to an audit log, viewable and exportable (CSV) by Admins.

---

## Features

1. **Authentication** — login with email or username, Sanctum token auth (8-hour
   expiry), account lockout after 3 consecutive failed attempts (15 min), Panitia
   selection step for multi-Panitia teachers.
2. **Registration** — public self-registration for teachers, pending admin approval.
3. **Document Upload** — AES-256-CBC encrypted storage, SHA-256 hash, Panitia-tagged.
4. **Approval Workflow** — admin approve/reject with mandatory reason, resubmission.
5. **Search & Retrieval** — filter by category/status/Panitia, on-the-fly decryption
   for preview/download, scoped by active Panitia for Teachers.
6. **Audit Logging** — full activity trail, Admin-only view with CSV export.
7. **Role Dashboards** — Admin (system-wide stats, pending registrations, Panitia
   overview), Teacher (Panitia-scoped stats).
8. **User Management** — Admin CRUD, registration approval/rejection, Panitia
   assignment (with primary flag).
9. **Panitia Management** — Admin CRUD for departments, member assignment/removal,
   primary Panitia reassignment.

---

## Prerequisites

- PHP 8.2+
- Composer
- Node.js 18+
- XAMPP (or any MySQL 8+ server)

---

## Local Setup

### 1. Database
1. Start XAMPP and make sure **MySQL** is running on port 3306.
2. Open phpMyAdmin (`http://localhost/phpmyadmin`) and create a database named `ssdms`.

> If you also have a standalone `MySQL80` Windows service, stop it first — a second
> MySQL instance already bound to port 3306 will make Laravel's connection fail with
> `SQLSTATE[HY000] [1045] Access denied`. See [Troubleshooting](#troubleshooting).

### 2. Backend (Laravel)
```bash
cd backend-laravel
composer install
copy .env.example .env      # (macOS/Linux: cp .env.example .env)
php artisan key:generate
```

Edit `.env` and set:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ssdms
DB_USERNAME=root
DB_PASSWORD=
```

Run migrations and seed the database (creates default Panitia + admin account):
```bash
php artisan migrate --seed
```

### 3. Frontend (React + Vite)
```bash
cd frontend
npm install
copy .env.example .env      # optional for local dev — see below
```

---

## Environment Variables

### Backend (`backend-laravel/.env`)
Key variables beyond the Laravel defaults:

| Variable        | Purpose                                   |
|-----------------|---------------------------------------------|
| `DB_CONNECTION` | Set to `mysql` for local/production use     |
| `DB_DATABASE`   | `ssdms`                                     |
| `DB_USERNAME` / `DB_PASSWORD` | XAMPP default is `root` / empty  |
| `APP_URL`       | Public URL of the Laravel API               |

Per-document encryption keys are generated randomly at upload time and stored
alongside each document record — no global file-encryption key needs to be set.

### Frontend (`frontend/.env`)

| Variable        | Purpose                                                                 |
|-----------------|---------------------------------------------------------------------------|
| `VITE_API_URL`  | Base URL of the deployed Laravel API. **Leave unset for local dev** — Vite's dev proxy (`vite.config.ts`) forwards `/api/*` to `http://127.0.0.1:8000` automatically. Set this only for production builds where the frontend and backend are hosted on different domains, e.g. `VITE_API_URL=https://api.yourdomain.com` (no trailing slash, no `/api` suffix). |

---

## Default Admin Account

Seeded by `php artisan migrate --seed`:

| Field    | Value                |
|----------|-----------------------|
| Email    | `admin@ssdms.local`   |
| Username | `admin`               |
| Password | `admin123`            |

Change this password after first login in a real deployment.

---

## Running the App

Backend:
```bash
cd backend-laravel
php artisan serve
```
Runs at `http://localhost:8000`.

Frontend:
```bash
cd frontend
npm run dev
```
Runs at `http://localhost:5174`, proxying `/api/*` to the Laravel server above.

---

## Deployment

The frontend (static SPA) and backend (persistent PHP process) are deployed
**separately** — they are not compatible with the same hosting model.

### Frontend → Vercel (or any static host)
1. Set the project's **Root Directory** to `frontend`, Framework Preset: Vite.
2. Add environment variable `VITE_API_URL` pointing at the deployed backend's URL.
3. `frontend/vercel.json` already declares the build/output config and an SPA
   rewrite (`/* → /index.html`) so client-side routes like `/login`, `/panitia`,
   `/select-panitia` don't 404 on direct load or refresh.
4. Deploy. Vercel builds with `npm run build` (`tsc && vite build`) into `dist/`.

### Backend → any PHP host (VPS, Railway, Render, Forge, etc.)
Vercel cannot run Laravel — it only serves static files and serverless functions,
while this backend needs a persistent PHP/MySQL process for Sanctum tokens, file
storage, and the audit/notification system. Deploy `backend-laravel/` to a
conventional PHP host:
```bash
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
```
Since the frontend authenticates with a `Bearer` token (not cookies), Laravel's
default CORS config (`allowed_origins: '*'`, no credentials) works cross-origin
without extra CORS setup. Point the frontend's `VITE_API_URL` at this backend's
public URL and redeploy the frontend.

---

## Troubleshooting

**`SQLSTATE[HY000] [1045] Access denied for user 'root'@'localhost'`**
Another MySQL instance (commonly a standalone `MySQL80` Windows service) is already
bound to port 3306 with a password set, conflicting with XAMPP's passwordless
`root` user. Stop the other MySQL service and make sure only XAMPP's MySQL is
running, then re-run `php artisan migrate`.

**`Could not open input file: artisan`**
`artisan` must be run from inside `backend-laravel/`. `cd` there first:
```bash
cd D:\SSDMS\backend-laravel
php artisan migrate
```

**Vercel deploy returns `404: NOT_FOUND` on every page**
The project's Root Directory wasn't pointed at `frontend/`, or the SPA rewrite is
missing. See [Deployment](#deployment) above.

**Teacher can't see a document they expect**
Check their **active Panitia** (shown in the topbar) — Teachers only see documents
belonging to the Panitia currently selected, not all Panitia they're a member of.
Switch Panitia from the topbar dropdown to see documents in another department.

Admin Login Credentials:
- Email : admin@ssdms.local
- Password : admin123

Teacher Login Credentials:
- Email : teacher@ssdms.local
- Password : password123