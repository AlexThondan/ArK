import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ManagerService {
  constructor(private readonly prisma: PrismaService) {}

  async teamOverview(managerId: string) {
    const team = await this.prisma.employee.findMany({ where: { managerId } });
    const teamUserIds = team.map((m) => m.userId);
    return {
      teamSize: team.length,
      openTasks: await this.prisma.task.count({
        where: { assignedTo: { in: teamUserIds }, status: { not: 'DONE' } }
      }),
      pendingLeaveApprovals: await this.prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
      pendingExpenses: await this.prisma.expense.count({ where: { status: 'PENDING' } })
    };
  }
}

