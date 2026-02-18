import { PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await argon2.hash('Password@123');

  const [admin, hr, manager, employeeUser] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@companysuite.com' },
      update: {},
      create: { email: 'admin@companysuite.com', passwordHash, role: Role.ADMIN }
    }),
    prisma.user.upsert({
      where: { email: 'hr@companysuite.com' },
      update: {},
      create: { email: 'hr@companysuite.com', passwordHash, role: Role.HR }
    }),
    prisma.user.upsert({
      where: { email: 'manager@companysuite.com' },
      update: {},
      create: { email: 'manager@companysuite.com', passwordHash, role: Role.MANAGER }
    }),
    prisma.user.upsert({
      where: { email: 'employee@companysuite.com' },
      update: {},
      create: { email: 'employee@companysuite.com', passwordHash, role: Role.EMPLOYEE }
    })
  ]);

  const dept = await prisma.department.upsert({
    where: { name: 'Engineering' },
    update: { managerId: manager.id },
    create: { name: 'Engineering', managerId: manager.id }
  });

  const employee = await prisma.employee.upsert({
    where: { userId: employeeUser.id },
    update: {},
    create: {
      userId: employeeUser.id,
      employeeCode: 'EMP-1001',
      firstName: 'Alex',
      lastName: 'Morgan',
      joinDate: new Date('2024-01-15'),
      departmentId: dept.id,
      managerId: manager.id,
      baseSalary: 5500
    }
  });

  const leavePolicy = await prisma.leavePolicy.upsert({
    where: { id: 'annual-leave-default' },
    update: {},
    create: { id: 'annual-leave-default', name: 'Annual Leave', annualQuota: 24, carryForwardLimit: 5 }
  });

  await prisma.leaveRequest.create({
    data: {
      employeeId: employee.id,
      policyId: leavePolicy.id,
      startDate: new Date('2026-03-12'),
      endDate: new Date('2026-03-14'),
      days: 2,
      reason: 'Family event'
    }
  });

  await prisma.task.create({
    data: {
      assignedBy: manager.id,
      assignedTo: employeeUser.id,
      title: 'Q1 KPI dashboard setup',
      description: 'Finalize role-wise KPI cards and trend charts.',
      priority: 'HIGH',
      status: 'IN_PROGRESS'
    }
  });

  await prisma.announcement.create({
    data: {
      title: 'Platform Launch',
      body: 'HRMS enterprise suite is live for all departments.',
      postedBy: admin.id
    }
  });

  void hr;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

