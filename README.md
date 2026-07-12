# Secure School Document Management System (SSDMS)

## Deployment Flow & Setup Guide

### Project Structure
```
d:\SSDMS/
├── backend/          # Node.js + Express backend (port 3000)
├── frontend/         # React + TypeScript + Vite frontend (port 5174)
├── .gitignore
└── README.md
```

---

## Step 1: Prerequisites
- Node.js 18+
- XAMPP (with MySQL)
- Git (optional)

---

## Step 2: Database Setup (XAMPP MySQL)
1. Start XAMPP and ensure MySQL is running (default port 3306)
2. Open phpMyAdmin (http://localhost/phpmyadmin)
3. Create a new database named `ssdms`
4. Import the schema from `backend/db/schema.sql` into the `ssdms` database

---

## Step 3: Backend Setup
1. Navigate to `backend/`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env` file (use `.env.example` as template)
4. Start backend:
   ```bash
   npm run dev
   ```

---

## Step 4: Frontend Setup
1. Navigate to `frontend/`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start frontend:
   ```bash
   npm run dev
   ```

---

## Step 5: Deployment
- For production:
  - Backend: `npm run build` then `npm start`
  - Frontend: `npm run build` (serve via Nginx/Apache)
