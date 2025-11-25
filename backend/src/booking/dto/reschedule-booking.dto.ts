import { IsNotEmpty, IsDateString, IsString } from 'class-validator';

export class RescheduleBookingDto {
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsNotEmpty()
  @IsString()
  startTime: string;
}
