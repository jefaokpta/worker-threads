import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { threadId } from 'node:worker_threads';

@Injectable()
export class CronService {

  private readonly logger = new Logger(CronService.name);

@Cron(CronExpression.EVERY_SECOND)
  eventLoopHealthCheck() {
    this.logger.log(`Event loop rodando THREAD ${threadId}`);
  }

}
