import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AttendanceService } from './attendance.service';

@UseGuards(JwtAuthGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('check-in')
  checkIn(@Req() req: { user: { sub: string } }) {
    return this.attendanceService.checkIn(req.user.sub);
  }

  @Post('check-out')
  checkOut(@Req() req: { user: { sub: string } }) {
    return this.attendanceService.checkOut(req.user.sub);
  }

  @Get('me')
  myLogs(@Req() req: { user: { sub: string } }) {
    return this.attendanceService.myLogs(req.user.sub);
  }
}

