import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { TasksService } from './tasks.service';

@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('me')
  myTasks(@Req() req: { user: { sub: string } }) {
    return this.tasksService.myTasks(req.user.sub);
  }

  @Post()
  create(@Req() req: { user: { sub: string; role: Role } }, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(req.user.sub, req.user.role, dto);
  }
}

