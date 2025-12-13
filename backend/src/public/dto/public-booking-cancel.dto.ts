import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class PublicBookingCancelDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  clientKey: string;
}

