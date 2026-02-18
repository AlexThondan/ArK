import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  systemOverview() {
    return Promise.all([
      this.prisma.user.count(),
      this.prisma.employee.count(),
      this.prisma.ticket.count({ where: { status: 'OPEN' } })
    ]).then(([users, employees, openTickets]) => ({
      activeUsers: users,
      employeeRecords: employees,
      openTickets,
      securityScore: 91
    }));
  }
}

