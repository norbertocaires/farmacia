import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../../modules/users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findOne(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado. Por favor, faça login novamente.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Usuário inativo. Entre em contato com o administrador.');
    }

    // Amarra o token à senha vigente no momento do login: se a senha foi
    // trocada depois (troca manual, reset do admin a cada deploy, etc.), o
    // token antigo perde a validade mesmo antes de expirar.
    const latestPassword = await this.usersService.getLatestPassword(user.id);
    if ((latestPassword?.id ?? null) !== payload.pwv) {
      throw new UnauthorizedException('Sessão expirada: a senha foi alterada. Faça login novamente.');
    }

    return user;
  }
}