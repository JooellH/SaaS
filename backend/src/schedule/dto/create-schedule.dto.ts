import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateScheduleDto {
  @IsNotEmpty()
  @IsString()
  businessId: string;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  @Max(6)
  weekday: number;

  @IsNotEmpty()
  @IsString()
  openTime: string;

  @IsNotEmpty()
  @IsString()
  closeTime: string;

  @IsOptional()
  @IsString()
  breakStart?: string;

  @IsOptional()
  @IsString()
  breakEnd?: string;
}
