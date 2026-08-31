import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { DatabaseSeeder } from './common/seeders/database.seeder';

import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { MedicinesModule } from './modules/medicines/medicines/medicines.module';
import { MedicinesImportModule } from './modules/medicines/medicines-import/medicines-import.module';
import { MedicationModule } from './modules/user-medication/usr-medication.module';
import { LogsModule } from './modules/log/logs.module';
import { PharmacyModule } from './modules/pharmacy/pharmacy.module';

import { User } from './modules/users/entities/user.entity';
import { Medicine } from './modules/medicines/entities/medicine.entity';
import { PasswordHistory } from './modules/users/entities/password-history.entity';
import { UserMedication } from './modules/user-medication/entities/user-medication.entity';
import { ActivityLog } from './modules/log/entities/activity-log.entity';
import { Pharmacy } from './modules/pharmacy/entities/pharmacy.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Limite global de requisições por IP para mitigar brute-force/DoS.
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 60,
    }]),

    // Configuração Assíncrona para PostgreSQL
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres', // Alterado de sqlite para postgres
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_DATABASE'),
        entities: [User, Medicine, PasswordHistory, UserMedication, ActivityLog, Pharmacy],
        synchronize: true,
        
        // Configuração vital para bancos na nuvem (Render/Supabase)

      }),
    }),

    TypeOrmModule.forFeature([User, PasswordHistory]),
    UsersModule,
    AuthModule,
    MedicinesModule,
    MedicinesImportModule,
    MedicationModule,
    LogsModule,
    PharmacyModule,
  ],
  providers: [
    DatabaseSeeder,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule { }