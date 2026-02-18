import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLeaveDto } from './dto/create-leave.dto';

@Injectable()
export class LeaveService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateLeaveDto) {
    const employee = await this.prisma.employee.findUnique({ where: { userId } });
    if (!employee) throw new NotFoundException('Employee not found');
    return this.prisma.leaveRequest.create({
      data: {
        employeeId: employee.id,
        policyId: dto.policyId,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        days: dto.days,
        reason: dto.reason ?? null
      }
    });
  }

  async myRequests(userId: string) {
    const employee = await this.prisma.employee.findUnique({ where: { userId } });
    if (!employee) return [];
    return this.prisma.leaveRequest.findMany({
      where: { employeeId: employee.id },
      include: { policy: true },
      orderBy: { createdAt: 'desc' }
    });
  }
}

