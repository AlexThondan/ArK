# ARK HRMS (Enterprise SaaS)

Production-ready HR Management System with secure Node/Express API, MongoDB, JWT auth + RBAC, and a modern React SaaS dashboard UI.

## Tech Stack

- Backend: Node.js, Express, MongoDB (Mongoose), JWT, bcrypt, multer
- Frontend: React (Vite), React Router, Axios, Recharts, Lucide icons
- Security: Helmet, CORS, rate limiting, password hashing, role-based route protection
- Deployment: Docker / Docker Compose, Render (API), Vercel (web)

## Monorepo Structure

```text
backend/
  src/
    config/
    controllers/
    middleware/
    models/
    routes/
    utils/
    seed/
frontend/
  src/
    api/
    components/
    context/
    hooks/
    layouts/
    pages/
    router/
    styles/
docker-compose.yml
```

## Database Schema (Collections + Relationships)

### `users`
- `email` (unique, indexed)
- `password` (hashed by bcrypt)
- `role` (`employee`, `admin`, indexed)
- `isActive` (indexed)

### `employees`
- `user` (ObjectId -> `users`, unique, indexed)
- profile fields: `firstName`, `lastName`, `phone`, `department`, `designation`, `salary`, `skills`, `certifications`
- `leaveBalance` object (`annual`, `sick`, `casual`)
- indexes: `department`, `designation`, name composite

### `attendance`
- `user` (ObjectId -> `users`, indexed)
- `date` (indexed), `checkIn`, `checkOut`, `workDurationMinutes`, `status`
- `departmentSnapshot` indexed for analytics
- compound unique index: `(user, date)`

### `leaves`
- `user` (ObjectId -> `users`, indexed)
- `leaveType`, `startDate`, `endDate`, `days`, `reason`, `status`
- review fields: `reviewedBy`, `reviewedAt`, `reviewComment`
- indexed for status/department/date filtering

### `tasks`
- `assignedTo` (ObjectId -> `users`, indexed)
- `assignedBy` (ObjectId -> `users`)
- `project` (ObjectId -> `projects`)
- `title`, `priority`, `status`, `progress`, `dueDate`, `attachments[]`
- composite index for assignee/status/deadline

### `projects`
- `name`, `code` (unique), `status`, `progress`, `client`, `members[]`, timeline fields
- indexes on `code`, `status`

### `clients`
- `name`, `company`, `email`, `phone`, `industry`, `address`
- searchable indexes on company/email/name

### `documents`
- `user` (owner), `uploadedBy`, `type`, `fileUrl`, metadata (`mimeType`, `size`)
- indexed by `(user, type, createdAt)`

## API Route List

### Auth
- `POST /api/auth/login`
- `POST /api/auth/register-admin`
- `GET /api/auth/me`
- `PUT /api/auth/change-password`

### Employees
- `GET /api/employees/me`
- `PUT /api/employees/me`
- `PUT /api/employees/me/avatar`
- `GET /api/employees` (admin)
- `POST /api/employees` (admin)
- `GET /api/employees/:id` (admin)
- `PUT /api/employees/:id` (admin)
- `DELETE /api/employees/:id` (admin)

### Attendance
- `POST /api/attendance/check-in` (employee)
- `POST /api/attendance/check-out` (employee)
- `GET /api/attendance/me` (employee)
- `GET /api/attendance/admin` (admin)
- `GET /api/attendance/admin/export` (admin CSV)

### Leaves
- `POST /api/leaves` (employee)
- `GET /api/leaves/me` (employee)
- `GET /api/leaves/admin` (admin)
- `PATCH /api/leaves/:id/review` (admin)
- `GET /api/leaves/analytics` (admin)

### Tasks / Projects / Clients / Docs / Dashboard / Reports
- `POST /api/tasks`, `GET /api/tasks/me`, `GET /api/tasks/admin`, `PATCH /api/tasks/:id/status`, `POST /api/tasks/:id/attachments`
- `POST /api/projects`, `GET /api/projects`, `GET /api/projects/:id`, `PATCH /api/projects/:id`
- `POST /api/clients`, `GET /api/clients`, `GET /api/clients/:id`, `PATCH /api/clients/:id`
- `POST /api/documents/upload`, `GET /api/documents/me`, `GET /api/documents/:id`
- `GET /api/dashboard/employee`, `GET /api/dashboard/admin`
- `GET /api/reports/department-productivity`, `GET /api/reports/leave-trends`, `GET /api/reports/performance`

## UI Wireframe (Textual)

### Common SaaS Layout
- Left fixed sidebar: logo, nav groups, role-aware items
- Top navbar: search, notifications, theme toggle, profile/logout
- Main content: KPI cards, charts, tables, modals

### Employee Dashboard
- KPI row: pending/completed tasks, leave balance
- Attendance trend line chart
- Leave balance donut chart
- Recent tasks and attendance timeline tables

### Admin Dashboard
- KPI row: total employees, active projects, pending leaves
- Attendance rate chart
- Performance/completion analytics chart
- Action tables for employees, leaves, attendance, clients, reports

## Setup Instructions

### 1) Backend
```bash
cd backend
cp .env.example .env
# update env values (MONGO_URI, JWT_SECRET, ADMIN_BOOTSTRAP_KEY)
npm install
npm run dev
```

### 2) Frontend
```bash
cd frontend
cp .env.example .env
# set VITE_API_BASE_URL=http://localhost:5000/api
npm install
npm run dev
```

### 3) Create Admin
- Option A: API bootstrap `POST /api/auth/register-admin` using `bootstrapKey`
- Option B: seed script
```bash
cd backend
npm run seed:admin
```

## Docker Deployment

```bash
# from repository root
docker compose up --build
```

- Frontend: `http://localhost:8080`
- Backend API: `http://localhost:5000/api`
- MongoDB: `mongodb://localhost:27017`

## Render + Vercel Deployment Guide

### Backend on Render
1. Create a new Render Web Service from `backend/`.
2. Build command: `npm install`
3. Start command: `npm start`
4. Add env vars from `backend/.env.example`.
5. Use Render MongoDB add-on or external Atlas URI for `MONGO_URI`.

### Frontend on Vercel
1. Import repository and set project root to `frontend/`.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Add env var: `VITE_API_BASE_URL=https://<your-render-api>/api`
5. Redeploy and verify login + RBAC redirects.

## Security Highlights

- Password hashing with bcrypt
- JWT-based auth with protected middleware
- Route-level RBAC (`employee` vs `admin`)
- Helmet security headers + rate-limited auth endpoints
- Global error handler and async wrapper

## Notes for Production Hardening

- Move uploads to S3-compatible storage
- Add schema validation layer (Zod/Joi)
- Add audit logs and refresh token rotation
- Add automated tests (unit/integration/e2e)
