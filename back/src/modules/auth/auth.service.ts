import { forwardRef, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';
import { LogsService } from '../log/logs.service';
import { LogAction } from '../log/enums/log-action.enum';
import { RequestInfo } from '../../common/utils/request-info.util';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private logsService: LogsService,
  ) {
    this.googleClient = new OAuth2Client(this.configService.get<string>('GOOGLE_CLIENT_ID'));
  }

  async signIn(email: string, pass: string, requestInfo?: RequestInfo) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      await this.logsService.record(LogAction.USER_LOGIN_FAILED, {
        userEmail: email,
        description: `Tentativa de login falhou: usuário ${email} não encontrado.`,
        requestInfo,
      });
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    if (!user.isActive) {
      await this.logsService.record(LogAction.USER_LOGIN_FAILED, {
        userId: user.id,
        userEmail: user.email,
        description: `Tentativa de login falhou: usuário ${user.email} está inativo.`,
        requestInfo,
      });
      throw new UnauthorizedException('Usuário inativo. Entre em contato com o administrador.');
    }

    const latestPassword = await this.usersService.getLatestPassword(user.id);

    if (!latestPassword || !(await bcrypt.compare(pass, latestPassword.passwordHash))) {
      await this.logsService.record(LogAction.USER_LOGIN_FAILED, {
        userId: user.id,
        userEmail: user.email,
        description: `Tentativa de login falhou: senha incorreta para ${user.email}.`,
        requestInfo,
      });
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    await this.logsService.record(LogAction.USER_LOGIN_SUCCESS, {
      userId: user.id,
      userEmail: user.email,
      description: `Usuário ${user.email} fez login.`,
      metadata: { metodo: 'senha' },
      requestInfo,
    });

    // 4. Gera o Token incluindo o ID no campo 'sub'
    const payload = {
      sub: user.id,      // O ID numérico aqui é o padrão (Subject)
      email: user.email,
      name: user.name,
      role: user.role
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };
  }

  async signInWithGoogle(idToken: string, requestInfo?: RequestInfo) {
    const ticket = await this.googleClient.verifyIdToken({
      idToken,
      audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
    }).catch(() => {
      throw new UnauthorizedException('Token do Google inválido.');
    });

    const payload = ticket.getPayload();
    if (!payload?.email) {
      throw new UnauthorizedException('Não foi possível obter o e-mail do Google.');
    }

    const user = await this.usersService.findOrCreateFromGoogle(payload.email, payload.name ?? payload.email);

    if (!user.isActive) {
      await this.logsService.record(LogAction.USER_LOGIN_FAILED, {
        userId: user.id,
        userEmail: user.email,
        description: `Tentativa de login com Google falhou: usuário ${user.email} está inativo.`,
        requestInfo,
      });
      throw new UnauthorizedException('Usuário inativo. Entre em contato com o administrador.');
    }

    await this.logsService.record(LogAction.USER_LOGIN_SUCCESS, {
      userId: user.id,
      userEmail: user.email,
      description: `Usuário ${user.email} fez login com Google.`,
      metadata: { metodo: 'google' },
      requestInfo,
    });

    const jwtPayload = { sub: user.id, email: user.email, name: user.name, role: user.role };

    return {
      access_token: await this.jwtService.signAsync(jwtPayload),
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  }
}