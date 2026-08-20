import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../modules/users/entities/user.entity';
import { PasswordHistory } from '../../modules/users/entities/password-history.entity';
import { Role } from '../enums/role.enum';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseSeeder implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatabaseSeeder.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(PasswordHistory)
    private readonly passwordHistoryRepository: Repository<PasswordHistory>,

    private readonly configService: ConfigService
  ) { }



  async onApplicationBootstrap() {

    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    const adminUsername = this.configService.get<string>('ADMIN_USERNAME');
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');

    if (!adminEmail || !adminUsername || !adminPassword) {
      this.logger.error(
        'Seed do admin ignorado: defina ADMIN_EMAIL, ADMIN_USERNAME e ADMIN_PASSWORD no .env.',
      );
      return;
    }

    // Só pode existir um SuperAdmin, e é sempre o do ADMIN_EMAIL atual — se o
    // e-mail mudou desde o último deploy (ou algum outro usuário virou
    // SuperAdmin por fora), rebaixa qualquer outro portador da role.
    const demoted = await this.userRepository.update(
      { role: Role.SUPER_ADMIN, email: Not(adminEmail) },
      { role: Role.ADMIN },
    );
    if (demoted.affected) {
      this.logger.warn(`${demoted.affected} usuário(s) rebaixado(s) de SuperAdmin (só ${adminEmail} pode ter essa role).`);
    }

    let admin = await this.userRepository.findOne({ where: { email: adminEmail } });

    if (!admin) {
      admin = await this.userRepository.save(
        this.userRepository.create({
          name: adminUsername,
          email: adminEmail,
          role: Role.SUPER_ADMIN,
          isActive: true,
        }),
      );

      this.logger.log(`Usuário admin criado: ${adminEmail}`);
    } else if (admin.role !== Role.SUPER_ADMIN || !admin.isActive) {
      await this.userRepository.update(admin.id, { role: Role.SUPER_ADMIN, isActive: true });
      admin.role = Role.SUPER_ADMIN;
      admin.isActive = true;
      this.logger.log(`Usuário ${adminEmail} promovido/reativado a SuperAdmin.`);
    }

    // A cada boot, a senha do super admin é realinhada com o ADMIN_PASSWORD do
    // ambiente atual — evita que uma senha alterada manualmente no banco (ou
    // vazada) sobreviva a um novo deploy.
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    await this.passwordHistoryRepository.save({
      passwordHash: hashedPassword,
      userId: admin.id,
    });

    this.logger.log(`Senha do admin ${adminEmail} sincronizada com ADMIN_PASSWORD.`);
  }
}
