import { Controller, Post, Body, Get, UseGuards, Query, Param, Patch, Request, Req, ForbiddenException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request as ExpressRequest } from 'express';
import { UsersService } from './users.service';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { FindUsersDto } from './dto/find-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ToggleStatusDto } from './dto/toggle-status.dto';
import { extractRequestInfo } from '../../common/utils/request-info.util';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post('register')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Cadastra um novo usuário' }) // Descrição da rota
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso.' })
  async register(@Body() userData: CreateUserDto, @Req() req: ExpressRequest) {
    const user = await this.usersService.create(userData, extractRequestInfo(req));

    const { ...result } = user;
    return result;
  }

  @Post('findAll')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.FARMACIA)
  @ApiOperation({ summary: 'Lista usuários com busca e paginação' })
  async findAll(@Body() filterDto: FindUsersDto) {
    return this.usersService.findAll(filterDto);
  }

  @Get(':email')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.FARMACIA)
  findOne(@Param('email') email: string) {
    return this.usersService.findByEmail(email);
  }

  @Patch(':email')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.FARMACIA, Role.USUARIO)
  update(
    @Param('email') email: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: ExpressRequest & { user: { email: string } },
  ) {
    if (req.user.email !== email) {
      throw new ForbiddenException('Você só pode editar o próprio perfil.');
    }
    return this.usersService.update(email, updateUserDto, extractRequestInfo(req));
  }

  @Patch(':email/role')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Atualiza a role de um usuário' })
  updateRole(
    @Param('email') email: string,
    @Body() dto: UpdateRoleDto,
    @Request() req: ExpressRequest & { user: { email: string } },
  ) {
    if (req.user.email === email) {
      throw new ForbiddenException('Você não pode alterar a própria role.');
    }
    return this.usersService.updateRole(email, dto.role, req.user.email, extractRequestInfo(req));
  }

  @Patch(':email/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Ativa ou desativa um usuário' })
  toggleStatus(
    @Param('email') email: string,
    @Body() dto: ToggleStatusDto,
    @Request() req: ExpressRequest & { user: { email: string } },
  ) {
    if (req.user.email === email) {
      throw new ForbiddenException('Você não pode alterar o próprio status.');
    }
    return this.usersService.toggleStatus(email, dto.isActive, req.user.email, extractRequestInfo(req));
  }
}