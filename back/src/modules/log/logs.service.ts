import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog } from './entities/activity-log.entity';
import { LogAction } from './enums/log-action.enum';
import { RequestInfo } from '../../common/utils/request-info.util';

interface RecordLogParams {
  userId?: number | null;
  userEmail: string;
  description: string;
  metadata?: Record<string, any>;
  requestInfo?: RequestInfo;
}

@Injectable()
export class LogsService {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly logRepo: Repository<ActivityLog>,
  ) { }

  async record(action: LogAction, params: RecordLogParams) {
    const log = this.logRepo.create({
      action,
      userId: params.userId ?? null,
      userEmail: params.userEmail,
      description: params.description,
      metadata: params.metadata ?? null,
      ipAddress: params.requestInfo?.ipAddress ?? null,
      userAgent: params.requestInfo?.userAgent ?? null,
      location: params.requestInfo?.location ?? null,
    });

    return this.logRepo.save(log);
  }

  async findByEmail(email: string, page = 1, limit = 10) {
    const [data, total] = await this.logRepo.findAndCount({
      where: { userEmail: email },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findAll(page = 1, limit = 10) {
    const [data, total] = await this.logRepo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }
}
