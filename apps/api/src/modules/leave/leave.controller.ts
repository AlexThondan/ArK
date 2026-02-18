import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { LeaveService } from './leave.service';

@UseGuards(JwtAuthGuard)
@Controller('leave-requests')
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @Post()
  create(@Req() req: { user: { sub: string } }, @Body() dto: CreateLeaveDto) {
    return this.leaveService.create(req.user.sub, dto);
  }

  @Get('me')
  myRequests(@Req() req: { user: { sub: string } }) {
    return this.leaveService.myRequests(req.user.sub);
  }
}

