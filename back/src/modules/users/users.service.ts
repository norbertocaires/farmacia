import { Injectable, ConflictException, BadRequestException, NotFoundException, Inject, forwardRef, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { PasswordHistory } from './entities/password-history.entity';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { FindUsersDto } from './dto/find-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth/auth.service';
import { Role } from '../../common/enums/role.enum';
import { LogsService } from '../log/logs.service';
import { LogAction } from '../log/enums/log-action.enum';
import { RequestInfo } from '../../common/utils/request-info.util';

@Injectable()
// REMOVIDO: @Module daqui. Módulos ficam em arquivos .module.ts, não no service!
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(PasswordHistory)
    private readonly passwordHistoryRepository: Repository<PasswordHistory>,

    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,

    private readonly jwtService: JwtService,

    private readonly logsService: LogsService,
  ) { }

  async create(userData: CreateUserDto, requestInfo?: RequestInfo): Promise<User> {
    if (!userData.email || !userData.password) {
      throw new BadRequestException('E-mail e senha são obrigatórios.');
    }

    const existingUser = await this.userRepository.findOne({ where: { email: userData.email } });
    if (existingUser) throw new ConflictException('Este e-mail já está em uso!');

    // 1. Cria o usuário (sem a senha na tabela User). Monta a entidade só com
    // campos explícitos — nunca espalha o body direto (evita mass assignment,
    // ex.: um "id" injetado no payload sobrescrevendo outro usuário).
    const { password, name, email } = userData;
    const newUser = await this.userRepository.save(
      this.userRepository.create({ name, email, role: Role.USUARIO }),
    );

    // 2. Salva a primeira senha no histórico
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    await this.passwordHistoryRepository.save({
      passwordHash: hashedPassword,
      userId: newUser.id
    });

    await this.logsService.record(LogAction.USER_REGISTERED, {
      userId: newUser.id,
      userEmail: newUser.email,
      description: `Usuário ${newUser.email} se cadastrou.`,
      requestInfo,
    });

    return newUser;
  }

  // Método usado pelo AuthService no Login
  async getLatestPassword(userId: number) {
    return await this.passwordHistoryRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async update(email: string, updateUserDto: UpdateUserDto, requestInfo?: RequestInfo) {
    const { password, name } = updateUserDto;

    const user = await this.userRepository.findOneBy({ email });

    if (!user) throw new NotFoundException('Usuário não encontrado!');

    if(user.role == Role.SUPER_ADMIN) throw new ConflictException('Usuário não pode ser editado!');

    // 1. Se houver troca de senha, salva no HISTÓRICO
    if (password) {
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(password, salt);

      await this.passwordHistoryRepository.save({
        passwordHash: hashedPassword,
        userId: user.id
      });
    }

    // 2. Atualiza dados básicos (nome, email) na tabela User
    if (name) {
      await this.userRepository.update(user.id, { name: name });
    }

    const updatedUser = await this.userRepository.findOneBy({ email });

    await this.logsService.record(LogAction.USER_PROFILE_UPDATED, {
      userId: user.id,
      userEmail: user.email,
      description: `Usuário ${user.email} editou o perfil.`,
      metadata: {
        nomeAlterado: !!name,
        senhaAlterada: !!password,
      },
      requestInfo,
    });

    // 3. Gera o Token incluindo o ID no campo 'sub'
    const payload = {
      sub: updatedUser?.id,      // O ID numérico aqui é o padrão (Subject)
      email: updatedUser?.email,
      name: updatedUser?.name,
      role: updatedUser?.role
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: updatedUser?.id,
        name: updatedUser?.name,
        email: updatedUser?.email,
        role: updatedUser?.role
      }
    };
  }

  async updateRole(email: string, role: Role, actorEmail?: string, requestInfo?: RequestInfo) {
    const user = await this.userRepository.findOneBy({ email });
    if (!user) throw new NotFoundException('Usuário não encontrado!');

    if(user.role == Role.SUPER_ADMIN){
      throw new BadRequestException('Usuário não pode ser editado!')
    }

    const previousRole = user.role;
    await this.userRepository.update(user.id, { role });

    await this.logsService.record(LogAction.USER_ROLE_CHANGED, {
      userId: user.id,
      userEmail: user.email,
      description: `Role do usuário ${user.email} alterada de ${previousRole} para ${role} por ${actorEmail ?? 'sistema'}.`,
      metadata: { de: previousRole, para: role, alteradoPor: actorEmail ?? null },
      requestInfo,
    });

    return { id: user.id, email: user.email, role };
  }

  async toggleStatus(email: string, isActive: boolean, actorEmail?: string, requestInfo?: RequestInfo) {
    const user = await this.userRepository.findOneBy({ email });
    if (!user) throw new NotFoundException('Usuário não encontrado!');

    if(user.role == Role.SUPER_ADMIN){
      throw new BadRequestException('Usuário não pode ser editado!')
    }

    const newStatus = !user.isActive;
    await this.userRepository.update(user.id, { isActive: newStatus });

    await this.logsService.record(newStatus ? LogAction.USER_ACTIVATED : LogAction.USER_DEACTIVATED, {
      userId: user.id,
      userEmail: user.email,
      description: newStatus
        ? `Usuário ${user.email} foi ativado por ${actorEmail ?? 'sistema'}.`
        : `Usuário ${user.email} foi desativado por ${actorEmail ?? 'sistema'}.`,
      metadata: { alteradoPor: actorEmail ?? null },
      requestInfo,
    });

    return { id: user.id, email: user.email, isActive: newStatus };
  }

  async findAll(dto: FindUsersDto) {
    const { search, page = 1, limit = 10, isActive } = dto;
    const skip = (page - 1) * limit;

    const query = this.userRepository.createQueryBuilder('user');

    if (isActive !== undefined) {
      query.andWhere('user.isActive = :isActive', { isActive });
    }

    if (search) {
      const searchTerm = `%${search.toLowerCase()}%`;

      // Usamos Brackets para criar o (OU) sem quebrar o resto da query
      query.andWhere(
        new Brackets((qb) => {
          qb.where('LOWER(user.name) LIKE :search', { search: searchTerm })
            .orWhere('LOWER(user.email) LIKE :search', { search: searchTerm });
        }),
      );
    }

    const [users, total] = await query
      .orderBy('user.email', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: users.map(({ ...user }) => user),
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }



  async findOrCreateFromGoogle(email: string, name: string): Promise<User> {
    let user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      user = await this.userRepository.save(
        this.userRepository.create({ email, name, isActive: true, role: Role.USUARIO }),
      );
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email: email }
    });
  }

  async findOne(id: number): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { id: id } as any 
    });
  }

}