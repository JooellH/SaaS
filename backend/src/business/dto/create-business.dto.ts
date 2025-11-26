import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateBusinessDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must be lowercase, numbers, and hyphens only',
  })
  slug: string;

  @IsNotEmpty()
  timezone: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  whatsappToken?: string;
}
