/**
 * @author Jefferson Alves Reis (jefaokpta)
 * @email jefaokpta@hotmail.com
 * @create 21/07/2025
 */

import { Controller, Get } from '@nestjs/common';
import { HeavyWorkService } from './heavy-work.service';

@Controller('heavy')
export class HeavyController {
  constructor(private readonly heavyWorkService: HeavyWorkService) {}

  @Get()
  heavyWork() {
    // return this.heavyWorkService.heavyWork()
    return this.heavyWorkService.heavyWorkRightWay()
  }
}