# Secure School Document Management System (SSDMS)

A document management system for SMK Kubor Panjang. Teachers upload lesson plans,
assessments and weekly activity reports; administrators review and approve them. Files are
encrypted on disk, access is limited by role and by subject department (Panitia), and
every important action is written to an audit log.

## Contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Project structure](#project-structure)
4. [How it works](#how-it-works)
5. [Setup](#setup)
6. [Running the app](#running-the-app)
7. [Accounts](#accounts)
8. [Configuration](#configuration)
9. [Scheduled reminders](#scheduled-reminders)
10. [Deployment](#deployment)
11. [Troubleshooting](#troubleshooting)

## Features

- **Accounts:** teachers self-register (with an optional profile photo) and wait for admin
  approval. Login works with email or username. Accounts lock for 15 minutes after 3 failed
  attempts. Forgot-password uses a 6-digit email code.
- **Documents:** upload, search, preview and download. Files are encrypted with AES-256 and
  carry a SHA-256 hash so an admin can verify they have not been tampered with.
- **Approval workflow:** admins approve or reject (a reason is required). Teachers can fix
  and resubmit rejected items.
- **Weekly activity reports:** one report per week, submitted on Saturday or Sunday. Late
  submissions are accepted but flagged. Admins get a tracker and a list of teachers who have
  not submitted.
- **Panitia (departments):** teachers belong to one or more Panitia and only see documents
  from the Panitia they are currently working in.
- **Admin tools:** user management, Panitia management, audit log with CSV export,
  notifications, dashboards for both roles.
- **Interface:** light and dark themes, responsive layout.

## Tech stack

| Part     | Technology                                              |
|----------|---------------------------------------------------------|
| Backend  | Laravel 12 (PHP 8.2+), Laravel Sanctum (API tokens)     |
| Frontend | React 18, TypeScript, Vite, React Router                |
| Database | MySQL (XAMPP for local development)                     |
| Security | AES-256-CBC file encryption, SHA-256 hashing, bcrypt    |

## Project structure

```
SSDMS/
├── backend-laravel/            Laravel API (port 8000)
│   ├── app/
│   │   ├── Console/Commands/   weekly report reminder commands
│   │   ├── Http/Controllers/   one controller per feature area
│   │   ├── Http/Middleware/    CheckUserActive, CheckPanitiaAccess, RoleMiddleware
│   │   ├── Mail/               password reset email
│   │   ├── Models/
│   │   ├── Services/           FileEncryptionService
│   │   └── Helpers.php         logAudit() helper
│   ├── database/
│   │   ├── migrations/         01_ ... 12_, one file per table
│   │   └── seeders/            admin account and default Panitia
│   └── routes/                 api.php, console.php (scheduler)
│
├── frontend/                   React app (port 5174)
│   ├── src/pages/              one file per screen
│   ├── src/components/         shared UI (Layout, modals, dropzone, avatar, ...)
│   ├── src/contexts/           auth, theme, toast
│   ├── src/services/api.ts     Axios instance (Bearer token + X-Active-Panitia header)
│   └── vercel.json             build config and SPA rewrite for Vercel
│
└── README.md
```

## How it works

### Roles

- **Admin** manages users and Panitia, reviews documents and weekly reports, reads the
  audit log, and can see everything.
- **Teacher** uploads documents and weekly reports for their active Panitia and sees only
  their own reports.

### Panitia and department access

A teacher can belong to several Panitia, with one marked as primary. After login:

- one Panitia: it is selected automatically;
- several Panitia: the teacher picks one on a selection screen.

The choice is sent with every request in the `X-Active-Panitia` header. The
`CheckPanitiaAccess` middleware checks it: admins pass straight through, while for teachers
it confirms the Panitia is assigned and active. Teachers can switch Panitia from the top bar.

### Registration

A new teacher fills in name, email, username, password, primary Panitia and an optional
photo. The account starts as `Pending` and cannot log in until an admin approves it in
User Management. Admins are notified of each new registration and can see the photo to
confirm who is registering.

### Profile photos

JPG, PNG or WebP, up to 2 MB. Photos are stored on the private disk
(`storage/app/private/profile-photos`), not in a public folder, and are served through an
authenticated endpoint. Only the owner and admins can view one. Users can change or remove
their photo under Settings → Profile Details.

### Documents

1. A teacher uploads a PDF, DOCX, DOC, JPG or PNG (max 10 MB) with a category and tags.
2. The file is encrypted with a random per-document key and a SHA-256 hash is stored.
3. Admins are notified. They approve or reject; rejection needs a reason.
4. A rejected document can be edited and resubmitted by its owner.
5. An admin can run **Verify** on any document to compare its stored hash with the
   decrypted file.

### Weekly activity reports

- A report has a title, week number, reporting period, Panitia, activity summary,
  challenges, actions taken and next week's plan, plus optional attachments (PDF, DOC/DOCX,
  XLS/XLSX, PPT/PPTX, JPG, PNG, max 10 MB each, encrypted like documents).
- The on-time window is **Saturday and Sunday**. Teachers can submit at any other time too,
  and the report is marked **Late** so the admin can see it.
- Status is `Pending Review`, `Approved` or `Rejected`. A rejected report can be edited and
  resubmitted. Late is a separate flag, so a late report still goes through normal approval.
- Admins can filter reports by week, teacher, Panitia, status or late-only, and open the
  **Not Submitted** tab to see who is missing a report for a given week.
- Teachers are notified when the window opens, shortly before the deadline, when a report is
  approved or rejected, and when they miss a week. Admins are notified of new and late
  submissions.

### Forgot password

1. The user enters their email on the login page's "Forgot password?" screen.
2. A 6-digit code is emailed. It expires after 10 minutes and works once.
3. After 5 wrong attempts the code is dead. Each email address can request at most 3 codes
   per hour.
4. With a valid code the user sets a new password. All their login sessions are signed out.

The response is the same whether or not the email exists, so the form cannot be used to
find out who has an account. Codes are stored hashed.

### Deleting users

A user can be deleted unless they own documents or weekly reports. Those are school records,
so the server refuses and suggests deactivating the account instead. When a user is deleted,
their notifications and login tokens go with them. Their audit-log entries are kept with the
user shown as empty. Admins cannot delete themselves.

### Audit log

Logins and lockouts, Panitia changes, document and report actions, user and Panitia
management, photo changes, password resets and blocked access attempts are all recorded.
Admins can browse and export the log as CSV.

## Setup

### Requirements

- PHP 8.2 or newer, with the `zip` extension enabled
- Composer
- Node.js 18 or newer
- MySQL 8 (XAMPP is fine)
- Git

### Windows notes

These come up on a fresh machine:

- **Keep the project out of OneDrive.** OneDrive turns folders into placeholders that PHP
  reports as not writable (`bootstrap/cache must be present and writable`). Use a plain
  path such as `C:\SSDMS`.
- **Composer says "zip extension and unzip/7z commands are both missing".** Open
  `C:\xampp\php\php.ini`, change `;extension=zip` to `extension=zip`, save, and open a new
  terminal. Check with `php -m | findstr zip`.
- **`npm` says "running scripts is disabled".** Run this once in PowerShell:
  `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`.
- **If `bootstrap/cache` or `storage/` folders are missing** (some copy methods skip empty
  folders), create them:
  ```powershell
  New-Item -ItemType Directory -Force -Path bootstrap\cache, storage\framework\cache\data, storage\framework\sessions, storage\framework\testing, storage\framework\views, storage\logs, storage\app\public
  ```

### 1. Database

Start XAMPP's MySQL, open phpMyAdmin (`http://localhost/phpmyadmin`) and create an empty
database called `ssdms`.

If another MySQL service (for example `MySQL80`) is already using port 3306, stop it first.

### 2. Backend

```bash
cd backend-laravel
composer install
copy .env.example .env
php artisan key:generate
```

On macOS or Linux use `cp` instead of `copy`. Then edit `.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ssdms
DB_USERNAME=root
DB_PASSWORD=
```

Create the tables and the starting data:

```bash
php artisan migrate --seed
```

### 3. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env` containing `VITE_API_URL=` with nothing after the equals sign. For
local development it must stay empty so requests go through Vite's proxy to the backend.

## Running the app

Run these in two separate terminals and leave both open. Always `cd` into the right folder
first, because `artisan` only works inside `backend-laravel`.

```bash
cd backend-laravel
php artisan serve
```

```bash
cd frontend
npm run dev
```

Open `http://localhost:5174`.

## Running the tests

The backend has an automated test suite (75 tests) covering login and lockout, department access,
document encryption and approval, weekly reports, password reset, audit export and user deletion.
It runs on an in-memory database, so it never touches your real data:

```bash
cd backend-laravel
php artisan test
```

## Accounts

The seeder creates one account:

| Email               | Username | Password   | Role  |
|---------------------|----------|------------|-------|
| `admin@ssdms.local` | `admin`  | `admin123` | Admin |

**Change this password before the system is used for real.**

There is no default teacher. To create one, either:

- register at `/register`, then approve the account under User Management, or
- create it directly in User Management with **New User**.

The seeder also creates 7 Panitia: Bahasa Melayu, Bahasa Inggeris, Mathematics, Science,
History, Islamic Education and ICT.

## Configuration

### Backend (`backend-laravel/.env`)

| Variable                                | Purpose                                                    |
|-----------------------------------------|------------------------------------------------------------|
| `DB_*`                                  | MySQL connection (see Setup)                               |
| `APP_URL`                               | Public URL of the API                                      |
| `SANCTUM_TOKEN_EXPIRY`                  | Login session length in minutes (default 480 = 8 hours)    |
| `MAIL_MAILER` and the other `MAIL_*`    | How emails are sent (see below)                            |

There is no global file-encryption key. Each document and attachment gets its own random key,
stored with its record.

### Email

`MAIL_MAILER=log` is the default, which writes emails to `storage/logs/laravel.log` instead of
sending them. That is enough for testing: request a reset code and read it from the log.

To send real email, put your provider's details in `.env`, for example:

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USERNAME=your-username
MAIL_PASSWORD=your-password
MAIL_FROM_ADDRESS="no-reply@your-school.edu"
MAIL_FROM_NAME="SSDMS"
```

### Frontend (`frontend/.env`)

| Variable       | Purpose                                                                  |
|----------------|--------------------------------------------------------------------------|
| `VITE_API_URL` | Leave empty locally. In production set it to the API's address with no trailing slash and no `/api`, for example `https://api.example.com`. |

### Database changes

The migrations are one file per table, numbered `01_` to `12_`. On a new install,
`php artisan migrate --seed` is all you need. If you pull an older copy of the project into
a database created from earlier migration files, rebuild it once with
`php artisan migrate:fresh --seed`. This **deletes all data** in that database.

## Scheduled reminders

Weekly report notifications are sent by three commands, scheduled in `routes/console.php`:

| When              | Command                           | What it does                                  |
|-------------------|-----------------------------------|-----------------------------------------------|
| Saturday 00:00    | `weekly-reports:notify-open`      | Tells teachers the window is open             |
| Sunday 18:00      | `weekly-reports:notify-deadline`  | Reminds teachers who have not submitted       |
| Monday 00:05      | `weekly-reports:notify-missed`    | Notifies teachers and admins about missed weeks |

Laravel only runs these if its scheduler is running:

- **Development:** keep `php artisan schedule:work` running in a third terminal.
- **Production:** run `php artisan schedule:run` every minute, using cron on Linux or Task
  Scheduler on Windows.

Everything else works without the scheduler.

## Deployment

The frontend is a static site and the backend is a PHP application with a database, so they
are hosted separately.

### Frontend (Vercel or any static host)

1. Set the Root Directory to `frontend` and the framework to Vite.
2. Set `VITE_API_URL` to the backend's public address.
3. `frontend/vercel.json` already contains the build settings and a rewrite so pages like
   `/login` and `/panitia` still load when opened directly.
4. Deploy. The build runs `npm run build` and publishes `dist/`.

### Backend (any PHP host with MySQL)

Vercel cannot run Laravel. Use a VPS or a PHP host, then:

```bash
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
```

Set `APP_ENV=production` and `APP_DEBUG=false`, point the web server at `public/`, and make
sure `storage/` and `bootstrap/cache/` are writable. Set up the scheduler as described above
and configure real email.

The frontend authenticates with a Bearer token rather than cookies, so Laravel's default CORS
settings work across domains. For stricter control, restrict the allowed origins to your
frontend's address.

## Troubleshooting

**`SQLSTATE[HY000] [1045] Access denied for user 'root'`**
Another MySQL service is using port 3306. Stop it so only XAMPP's MySQL is running.

**`Could not open input file: artisan`**
You are not inside `backend-laravel`. `cd` into it first.

**`bootstrap/cache directory must be present and writable`**
The folder is missing or the project is inside OneDrive. See [Windows notes](#windows-notes).

**Login says "Login failed" and the backend works**
Check `frontend/.env`. `VITE_API_URL` must be empty for local development. Restart
`npm run dev` after changing it.

**"Your account is locked"**
Three wrong passwords lock a teacher's account for 15 minutes. Admin accounts are not locked.

**The password reset email never arrives**
With `MAIL_MAILER=log` nothing is sent. Open `backend-laravel/storage/logs/laravel.log` and
look for the code near the bottom.

**No reminders are being sent**
The scheduler is not running. See [Scheduled reminders](#scheduled-reminders).

**A teacher cannot see a document**
Teachers only see documents from their active Panitia, shown in the top bar. Switch Panitia
there to see another department's documents.

**A user cannot be deleted**
They own documents or weekly reports. Deactivate the account instead.

**Vercel shows `404: NOT_FOUND` on every page**
The Root Directory is not set to `frontend`, or `vercel.json` is missing.
