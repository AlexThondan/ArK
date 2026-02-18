import { Controller, Get, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { HrService } from './hr.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.HR, Role.ADMIN)
@Controller('hr')
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Get('analytics')
  analytics() {
    return this.hrService.analytics();
  }
}

