import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(userId: string, role: Role) {
    if (role === Role.EMPLOYEE) {
      const employee = await this.prisma.employee.findUnique({ where: { userId } });
      const recentAttendance = employee
        ? await this.prisma.attendanceLog.findMany({
            where: { employeeId: employee.id },
            orderBy: { checkInAt: 'desc' },
            take: 14
          })
        : [];
      const leaveBalance = { annual: 24, used: 8, remaining: 16 };
      const openTasks = await this.prisma.task.count({
        where: { assignedTo: userId, status: { not: 'DONE' } }
      });
      return { role, recentAttendance, leaveBalance, openTasks };
    }

    if (role === Role.MANAGER) {
      const team = await this.prisma.employee.findMany({ where: { managerId: userId } });
      const teamUserIds = team.map((t) => t.userId);
      const taskCompletion = {
        completed: await this.prisma.task.count({ where: { assignedTo: { in: teamUserIds }, status: 'DONE' } }),
        open: await this.prisma.task.count({ where: { assignedTo: { in: teamUserIds }, status: { not: 'DONE' } } })
      };
      return { role, teamSize: team.length, taskCompletion, absenteeRate: 5.4 };
    }

    if (role === Role.HR) {
      const headcount = await this.prisma.employee.count({ where: { status: 'ACTIVE' } });
      const payroll = await this.prisma.employee.aggregate({ _sum: { baseSalary: true } });
      return {
        role,
        headcount,
        attritionRate: 3.2,
        monthlyPayrollCost: payroll._sum.baseSalary ?? 0,
        hiringFunnel: { applied: 210, interviewed: 44, offered: 12, hired: 8 }
      };
    }

    return {
      role,
      systemUsage: 87,
      activeUsers: await this.prisma.user.count(),
      securityEvents: 3
    };
  }
}

