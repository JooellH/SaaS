import { Controller, Get, Param } from '@nestjs/common';
import { PublicService } from './public.service';

@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get(':slug')
  getBusinessBySlug(@Param('slug') slug: string) {
    return this.publicService.getBusinessBySlug(slug);
  }
}
