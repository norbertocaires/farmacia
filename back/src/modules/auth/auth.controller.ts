import { Body, Controller, Post, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login-user.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { extractRequestInfo } from '../../common/utils/request-info.util';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Realiza o login e retorna o access_token' })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso.' })
  @ApiResponse({ status: 401, description: 'E-mail ou senha incorretos.' })
  signIn(@Body() signInDto: LoginDto, @Req() req: ExpressRequest) {
    return this.authService.signIn(signInDto.email, signInDto.password, extractRequestInfo(req));
  }

  @HttpCode(HttpStatus.OK)
  @Post('google')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Login com Google (idToken)' })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Token do Google inválido.' })
  googleLogin(@Body() dto: GoogleLoginDto, @Req() req: ExpressRequest) {
    return this.authService.signInWithGoogle(dto.idToken, extractRequestInfo(req));
  }
}