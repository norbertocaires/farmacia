import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogsService } from './logs.service';
import { LogsController } from './logs.controller';
import { ActivityLog } from './entities/activity-log.entity';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([ActivityLog])],
  controllers: [LogsController],
  providers: [LogsService, RolesGuard],
  exports: [LogsService],
})
export class LogsModule { }
