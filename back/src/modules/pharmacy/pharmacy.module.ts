import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pharmacy } from './entities/pharmacy.entity';
import { UserMedication } from '../user-medication/entities/user-medication.entity';
import { PharmacyService } from './pharmacy.service';
import { PharmacyController } from './pharmacy.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Pharmacy, UserMedication])],
  controllers: [PharmacyController],
  providers: [PharmacyService],
  exports: [PharmacyService],
})
export class PharmacyModule { }
