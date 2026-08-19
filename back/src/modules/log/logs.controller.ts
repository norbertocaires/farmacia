import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { LogsService } from './logs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { FindLogsDto } from './dto/find-logs.dto';

@ApiBearerAuth()
@Controller('logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LogsController {
  constructor(private readonly logsService: LogsService) { }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Lista os logs de atividade dos usuários' })
  findAll(@Query() { page, limit }: FindLogsDto) {
    return this.logsService.findAll(page ?? 1, limit ?? 10);
  }

  @Get(':email')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Lista os logs de atividade de um usuário específico' })
  findByEmail(@Param('email') email: string, @Query() { page, limit }: FindLogsDto) {
    return this.logsService.findByEmail(email, page ?? 1, limit ?? 10);
  }
}
