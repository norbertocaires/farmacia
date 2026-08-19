import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';

import { MedicinesService } from './medicines.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/enums/role.enum';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GetMedicinesFilterDto } from './dto/get-medicines-filter.dto';

@ApiTags('medicines')
@ApiBearerAuth()
@Controller('medicines')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MedicinesController {
  constructor(private readonly medicinesService: MedicinesService) { }

  @ApiOperation({ summary: 'Buscar remédios por nome (Autocomplete)' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.FARMACIA, Role.USUARIO)
  @Get('search')
  search(@Query('term') term: string) {
    if (!term) return [];
    return this.medicinesService.search(term);
  }

  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.FARMACIA, Role.USUARIO)
  @Post('findAll')
  async findAll(@Body() filterDto: GetMedicinesFilterDto) {
    return this.medicinesService.findAll(filterDto);
  }
}
