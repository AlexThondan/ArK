# Architecture

```mermaid
flowchart LR
  U[Employee / Manager / HR / Admin] --> WAF[CDN + WAF]
  WAF --> WEB[Next.js Web Portal]
  WEB --> API[NestJS API]
  API --> AUTH[JWT + RBAC]
  API --> DOM[Domain Modules]
  DOM --> DB[(PostgreSQL)]
  DOM --> OBJ[(Object Storage)]
  DOM --> Q[Queue/Redis]
  API --> OBS[Logs + Metrics + Traces]
```

## Modules
- Auth: login, refresh, JWT strategy
- Users: self-profile
- Employees: HR/Admin CRUD
- Attendance: check-in/check-out/history
- Leave: request + status tracking
- Expenses: claim + list
- Tasks: assignment + execution tracking
- Dashboard: role-wise analytics

