/**
 * @author Jefferson Alves Reis (jefaokpta)
 * @email jefaokpta@hotmail.com
 * @create 21/07/2025
 */

import { Module } from '@nestjs/common';
import { HeavyController } from './heavy.controller';
import { HeavyWorkService } from './heavy-work.service';

@Module({
  controllers: [HeavyController],
  providers: [HeavyWorkService],
})
export class HeavyModule {}