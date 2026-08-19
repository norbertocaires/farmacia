import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicinesImportService } from './medicines-import.service';
import { MedicinesImportController } from './medicines-import.controller';
import { Medicine } from '../entities/medicine.entity';
import { SyncGateway } from '../../../common/socket-io/sync.gateway';
import { UsersModule } from '../../../modules/users/users.module';
import { AuthModule } from '../../../modules/auth/auth.module';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { LogsModule } from '../../log/logs.module';

@Module({
  imports: [TypeOrmModule.forFeature([Medicine]), UsersModule, AuthModule, LogsModule],
  controllers: [MedicinesImportController],
  providers: [MedicinesImportService, SyncGateway, RolesGuard],
  exports: [MedicinesImportService]
})
export class MedicinesImportModule {}