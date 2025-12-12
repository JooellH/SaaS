import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateSubscriptionDto {
  @IsNotEmpty()
  @IsString()
  planId: string;
}
