import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicinesService } from './medicines.service';
import { MedicinesController } from './medicines.controller';
import { Medicine } from '../entities/medicine.entity';
import { UsersModule } from '../../../modules/users/users.module';
import { RolesGuard } from '../../../common/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Medicine]), UsersModule],
  controllers: [MedicinesController],
  providers: [MedicinesService, RolesGuard],
  exports: [MedicinesService]
})
export class MedicinesModule {}