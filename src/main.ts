import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Worker } from 'node:worker_threads';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

const worker = new Worker('./dist/worker.js');
worker.postMessage('Hello World!');

worker.on('message', (data) => {
  console.log('Received from worker:', data);
});

worker.on('error', (error) => {
  console.error('Worker error:', error);
});

worker.on('exit', (code) => {
  console.log(`Worker stopped with exit code ${code}`);
});

