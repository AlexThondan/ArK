# Enterprise HRMS Solution Blueprint

## Folder Structure

```txt
company-suite/
  apps/
    api/
      prisma/
      src/common/
      src/modules/
    web/
      src/app/
      src/components/
      src/lib/
  packages/
    ui/
    sdk/
  infra/docker/
  docs/
```

## UI Pages
- `/login`
- `/dashboard`
- `/employees`
- `/attendance`
- `/leave`
- `/expenses`
- `/tasks`

Planned enterprise routes:
- `/payslips`, `/goals`, `/reviews`, `/messages`, `/tickets`
- `/manager/team`, `/manager/reports`, `/manager/approvals`
- `/hr/payroll`, `/hr/recruitment`, `/hr/compliance`, `/hr/analytics`
- `/admin/settings`, `/admin/roles`, `/admin/logs`, `/admin/security`

## Reusable Components
- `src/components/layout/portal-shell.tsx`
- `src/components/ui/stat-card.tsx`
- `src/components/charts/line-kpi-chart.tsx`
- `packages/ui/src/skeleton.tsx`

## Best Practices Applied
- JWT auth + role guard middleware
- Input validation with class-validator DTOs
- Prisma schema with normalized HRMS entities
- Modular backend by domain bounded contexts
- Premium responsive UI with Tailwind + glass cards
- Analytics dashboard with charts and role-wise KPIs

