# Company Suite (Enterprise HRMS)

Production-ready monorepo starter for an enterprise Company Management System:
- Employee portal
- Manager portal
- HR portal
- Admin portal

Tech stack:
- Frontend: Next.js, TypeScript, TailwindCSS, Recharts, Framer Motion
- Backend: NestJS, Prisma, PostgreSQL, JWT + RBAC
- Monorepo: npm workspaces

## Quick Start

1. Install dependencies:
```bash
npm install
```
2. Create env files:
```bash
copy apps\api\.env.example apps\api\.env
copy apps\web\.env.example apps\web\.env
```
3. Start PostgreSQL and Redis using Docker:
```bash
docker compose -f infra/docker/docker-compose.yml up -d
```
4. Run migrations:
```bash
npm run db:generate -w apps/api
npm run db:migrate -w apps/api
npm run db:seed -w apps/api
```
5. Start apps:
```bash
npm run dev
```

## Monorepo

- `apps/api` NestJS backend
- `apps/web` Next.js frontend
- `packages/ui` shared UI components
- `packages/sdk` typed client
- `infra/docker` local infra

