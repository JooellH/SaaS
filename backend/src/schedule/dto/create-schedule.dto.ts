import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

class IntervalDto {
  @IsNotEmpty()
  start: string;

  @IsNotEmpty()
  end: string;
}

export class CreateScheduleDto {
  @IsNotEmpty()
  @IsInt()
  weekday: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IntervalDto)
  intervals: IntervalDto[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
