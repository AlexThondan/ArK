import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  myTasks(userId: string) {
    return this.prisma.task.findMany({
      where: { assignedTo: userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  create(creatorId: string, creatorRole: Role, dto: CreateTaskDto) {
    if (![Role.MANAGER, Role.HR, Role.ADMIN].includes(creatorRole)) {
      throw new UnauthorizedException('Only manager, HR and admin can assign tasks');
    }
    return this.prisma.task.create({
      data: {
        assignedBy: creatorId,
        assignedTo: dto.assignedTo,
        title: dto.title,
        description: dto.description ?? null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null
      }
    });
  }
}

