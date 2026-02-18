import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateLeaveDto {
  @IsString()
  policyId!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsNumber()
  days!: number;

  @IsOptional()
  @IsString()
  reason?: string;
}

