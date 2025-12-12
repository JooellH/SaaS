import { IsNotEmpty, IsString, IsOptional, MinLength } from 'class-validator';

export class AcceptInviteDto {
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
