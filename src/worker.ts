/**
 * @author Jefferson Alves Reis (jefaokpta)
 * @email jefaokpta@hotmail.com
 * @create 18/07/2025
 */
import { parentPort } from 'worker_threads';
import * as process from 'node:process';
import { spawnSync } from 'node:child_process';

async function main(message: any) {
  const pid = process.pid;
  console.log(`Worker ${pid} Executando trabalho pesado`);
  spawnSync('sleep', ['10'], { shell: true });
  console.log('Worker ${pid} terminou o trabalho pesado');

  // Send response back to main thread
  parentPort?.postMessage(`Worker ${pid} mandando msg terminou: ${message}`);
}

// Listen for messages from the main thread
parentPort?.on('message', main);
