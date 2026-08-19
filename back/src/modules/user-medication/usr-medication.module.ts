import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserMedicationController } from './user-medication.controller';
import { UserMedicationService } from './user-medication.service';
import { UserMedication } from './entities/user-medication.entity';
import { Medicine } from '../medicines/entities/medicine.entity';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { RolesGuard } from '../../common/guards/roles.guard';
import { LogsModule } from '../log/logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserMedication, Medicine, User]),
    forwardRef(() => UsersModule),
    LogsModule,
  ],
  controllers: [UserMedicationController],
  providers: [UserMedicationService, RolesGuard],
  exports: [UserMedicationService],
})
export class MedicationModule {}