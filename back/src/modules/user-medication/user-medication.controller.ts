import { Controller, Post, Get, Body, Request, UseGuards, Delete, Param, Patch, Query, ParseIntPipe } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { UserMedicationService } from './user-medication.service';
import { LinkMedicationDto } from './dto/link-medication.dto';
import { UpdateMedicationDto } from './dto/update-medication.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { ApiBearerAuth } from '@nestjs/swagger';
import { extractRequestInfo } from '../../common/utils/request-info.util';

@ApiBearerAuth()
@Controller('meus-remedios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserMedicationController {
  constructor(private readonly userMedService: UserMedicationService) { }

  @Post('vincular')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.FARMACIA, Role.USUARIO)
  async link(@Request() req: ExpressRequest & { user: { email: string } }, @Body() dto: LinkMedicationDto) {
    return this.userMedService.vincularRemedio(req.user.email, dto, extractRequestInfo(req));
  }

  @Get('resumo')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.FARMACIA, Role.USUARIO)
  async getFinances(
    @Request() req: { user: { email: string } },
    @Query('busca') busca?: string,
  ) {
    return this.userMedService.getUserFinancesByEmail(req.user.email, busca);
  }

  @Get('resumo/periodo')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.FARMACIA, Role.USUARIO)
  async getFinancesByPeriod(
    @Request() req: { user: { email: string } },
    @Query('inicio') inicio: string,
    @Query('fim') fim: string,
    @Query('busca') busca?: string,
  ) {
    return this.userMedService.getUserFinancesByEmailAndPeriod(req.user.email, inicio, fim, busca);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.FARMACIA, Role.USUARIO)
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req: { user: { email: string } }) {
    return this.userMedService.findOneByEmail(id, req.user.email);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.FARMACIA, Role.USUARIO)
  async update(@Param('id', ParseIntPipe) id: number, @Request() req: ExpressRequest & { user: { id: number } }, @Body() dto: UpdateMedicationDto) {
    return this.userMedService.update(id, req.user.id, dto, extractRequestInfo(req));
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.FARMACIA, Role.USUARIO)
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req: ExpressRequest & { user: { id: number } }) {
    return this.userMedService.remove(id, req.user.id, extractRequestInfo(req));
  }
}
