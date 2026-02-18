import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async checkIn(userId: string) {
    const employee = await this.prisma.employee.findUnique({ where: { userId } });
    if (!employee) throw new NotFoundException('Employee not found');
    return this.prisma.attendanceLog.create({ data: { employeeId: employee.id, checkInAt: new Date() } });
  }

  async checkOut(userId: string) {
    const employee = await this.prisma.employee.findUnique({ where: { userId } });
    if (!employee) throw new NotFoundException('Employee not found');
    const openLog = await this.prisma.attendanceLog.findFirst({
      where: { employeeId: employee.id, checkOutAt: null },
      orderBy: { checkInAt: 'desc' }
    });
    if (!openLog) throw new NotFoundException('No active check-in');
    return this.prisma.attendanceLog.update({
      where: { id: openLog.id },
      data: { checkOutAt: new Date() }
    });
  }

  async myLogs(userId: string) {
    const employee = await this.prisma.employee.findUnique({ where: { userId } });
    if (!employee) return [];
    return this.prisma.attendanceLog.findMany({
      where: { employeeId: employee.id },
      orderBy: { checkInAt: 'desc' },
      take: 60
    });
  }
}

