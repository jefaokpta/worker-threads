import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScheduleModule } from '@nestjs/schedule';
import { CronModule } from './cron/cron.module';
import { ApiModule } from './api/api.module';
import { HeavyModule } from './heavy/heavy.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    CronModule,
    ApiModule,
    HeavyModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
  ],
})
export class AppModule {}
