/**
 * @author Jefferson Alves Reis (jefaokpta)
 * @email jefaokpta@hotmail.com
 * @create 18/07/2025
 */
import { parentPort } from 'worker_threads';
import * as process from 'node:process';

async function main(message: any) {
  const pid = process.pid;
  console.log(`Worker ${pid} is running`);
  console.log('Received message:', message);

  // Send response back to main thread
  parentPort?.postMessage(`Worker ${pid} processed: ${message}`);
}

// Listen for messages from the main thread
parentPort?.on('message', main);
