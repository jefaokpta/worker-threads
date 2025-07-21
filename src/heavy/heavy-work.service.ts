/**
 * @author Jefferson Alves Reis (jefaokpta)
 * @email jefaokpta@hotmail.com
 * @create 21/07/2025
 */
import { Injectable } from '@nestjs/common';
import { Worker } from 'node:worker_threads';
import { spawnSync } from 'node:child_process';

@Injectable()
export class HeavyWorkService {
  private worker: Worker;
  private isWorkerBusy = false;

  constructor() {
    this.createWorker();
  }

  private createWorker() {
    this.worker = new Worker('./dist/worker.js');
    this.isWorkerBusy = false
    this.worker.on('message', (message) => {
      console.log(message);
      this.isWorkerBusy = false
    })
    this.worker.on('error', (error) => {
      console.error('Worker error:', error);
      this.isWorkerBusy = false
    });
    this.worker.on('exit', (code) => {
      console.log(`${code} - desligou worker, reiniciando...`);
      this.createWorker();
    });
  }

  heavyWork() {
    console.log('Executando trabalho pesado');
    spawnSync('sleep', ['10'], { shell: true });
    console.log('terminou o trabalho pesado');
  }

  heavyWorkRightWay() {
    if (this.isWorkerBusy) {
      throw new Error('Worker esta ocupado, tente novamente em alguns segundos');
    }
    this.isWorkerBusy = true;
    this.worker.postMessage('uniqueid');
  }


}