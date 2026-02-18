import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpensesService } from './expenses.service';

@UseGuards(JwtAuthGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  create(@Req() req: { user: { sub: string } }, @Body() dto: CreateExpenseDto) {
    return this.expensesService.create(req.user.sub, dto);
  }

  @Get('me')
  myExpenses(@Req() req: { user: { sub: string } }) {
    return this.expensesService.myExpenses(req.user.sub);
  }
}

