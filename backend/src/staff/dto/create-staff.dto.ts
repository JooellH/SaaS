import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateStaffDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsArray()
  permissions?: any; // JSON object
}
