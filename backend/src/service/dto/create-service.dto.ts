import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateServiceDto {
  @IsNotEmpty()
  @IsString()
  businessId: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  durationMinutes: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  cleaningTimeMinutes: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  price: number;
}
