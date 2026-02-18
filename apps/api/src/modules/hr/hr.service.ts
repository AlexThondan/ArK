import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HrService {
  constructor(private readonly prisma: PrismaService) {}

  async analytics() {
    const headcount = await this.prisma.employee.count({ where: { status: 'ACTIVE' } });
    const payroll = await this.prisma.employee.aggregate({ _sum: { baseSalary: true } });
    return {
      headcount,
      attritionRate: 3.2,
      monthlyPayrollCost: payroll._sum.baseSalary ?? 0,
      diversityIndex: 78
    };
  }
}

