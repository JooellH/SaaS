import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { LogsService } from './logs.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get(':businessId')
  async getLogs(@Param('businessId') businessId: string) {
    // TODO: Verify user is owner of businessId
    const actions = await this.logsService.getActionLogs(businessId);
    const errors = await this.logsService.getErrorLogs(businessId);
    
    return {
      actions,
      errors,
    };
  }
}
