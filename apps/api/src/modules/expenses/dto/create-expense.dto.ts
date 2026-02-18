import { IsDateString, IsNumber, IsString } from 'class-validator';

export class CreateExpenseDto {
  @IsString()
  category!: string;

  @IsNumber()
  amount!: number;

  @IsDateString()
  expenseDate!: string;
}

