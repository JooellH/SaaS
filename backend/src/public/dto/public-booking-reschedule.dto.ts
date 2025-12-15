import { IsDateString, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class PublicBookingRescheduleDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  clientKey: string;

  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsNotEmpty()
  @IsString()
  startTime: string;
}
