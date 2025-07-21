/**
 * @author Jefferson Alves Reis (jefaokpta)
 * @email jefaokpta@hotmail.com
 * @create 21/07/2025
 */
import { Injectable } from '@nestjs/common';
import { Worker } from 'node:worker_threads';
import { spawnSync } from 'node:child_process';
import { worker } from 'globals';

@Injectable()
export class HeavyWorkService {
  private worker: Worker;

  constructor() {
    this.createWorker();
  }

  private createWorker() {
    this.worker = new Worker('./dist/worker.js');
    this.worker.on('message', (message) => {
      console.log('message from worker:', message);
    })
    this.worker.on('error', (error) => {
      console.error('Worker error:', error);
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
    this.worker.postMessage('uniqueid');
  }


}