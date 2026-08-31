import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PharmacyService } from './pharmacy.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiBearerAuth()
@Controller('pharmacies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PharmacyController {
  constructor(private readonly pharmacyService: PharmacyService) { }

  @Get('mine')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.FARMACIA, Role.USUARIO)
  @ApiOperation({ summary: 'Farmácias já usadas pelo usuário logado, mais recente primeiro' })
  findMine(@Request() req: ExpressRequest & { user: { id: number } }) {
    return this.pharmacyService.findRecentForUser(req.user.id);
  }
}
