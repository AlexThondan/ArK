import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEmployeeDto) {
    const passwordHash = await argon2.hash(dto.password);
    return this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: Role.EMPLOYEE,
        employee: {
          create: {
            employeeCode: `EMP-${Date.now()}`,
            firstName: dto.firstName,
            lastName: dto.lastName,
            joinDate: new Date(dto.joinDate),
            departmentId: dto.departmentId ?? null
          }
        }
      },
      include: { employee: true }
    });
  }

  list() {
    return this.prisma.employee.findMany({
      include: { user: true, department: true },
      orderBy: { createdAt: 'desc' }
    });
  }
}

