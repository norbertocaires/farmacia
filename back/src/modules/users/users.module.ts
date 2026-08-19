import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { PasswordHistory } from './entities/password-history.entity';
import { AuthModule } from '../auth/auth.module';
import { RolesGuard } from '../../common/guards/roles.guard';
import { LogsModule } from '../log/logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, PasswordHistory]),
    forwardRef(() => AuthModule),
    LogsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, RolesGuard],
  exports: [UsersService],
})
export class UsersModule {}
