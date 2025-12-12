import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  IsUrl,
  IsHexColor,
} from 'class-validator';

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

  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @IsOptional()
  @IsHexColor()
  brandColor?: string;

  @IsOptional()
  @IsUrl()
  bannerUrl?: string;
}
