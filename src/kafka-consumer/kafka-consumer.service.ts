import { Injectable, OnModuleInit, OnApplicationShutdown } from '@nestjs/common';
import { Kafka, Consumer, EachBatchPayload, logLevel } from 'kafkajs';

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnApplicationShutdown {
  private kafka: Kafka;
  private consumer: Consumer;
  private isWorkerBusy: boolean = false; // Flag para controlar se o worker está ocupado

  constructor() {
    this.kafka = new Kafka({
      clientId: 'my-long-processing-consumer-nestjs',
      brokers: ['localhost:9092'], // Substitua pelos seus brokers Kafka
      logLevel: logLevel.INFO,
    });

    this.consumer = this.kafka.consumer({ groupId: 'my-processing-group-nestjs' });
  }

  async onModuleInit() {
    await this.connect();
    await this.subscribe('my-topic'); // Substitua pelo seu tópico
    this.runConsumer();
  }

  async onApplicationShutdown() {
    await this.disconnect();
  }

  private async connect() {
    await this.consumer.connect();
    console.log('Consumidor Kafka conectado.');
  }

  private async disconnect() {
    await this.consumer.disconnect();
    console.log('Consumidor Kafka desconectado.');
  }

  private async subscribe(topic: string) {
    await this.consumer.subscribe({ topic, fromBeginning: false });
    console.log(`Consumidor inscrito no tópico: ${topic}`);
  }

  private async simulateLongProcessing(message: any): Promise<void> {
    console.log(` Iniciando processamento da mensagem offset: ${message.offset} (Partição: ${message.partition})`);
    // Simula uma tarefa de 10 segundos devido a limitações de hardware
    await new Promise(resolve => setTimeout(resolve, 10000)); // 10 segundos
    console.log(` Processamento da mensagem offset: ${message.offset} concluído.`);

    // Exemplo: Simula uma falha de processamento aleatória para demonstração
    // if (Math.random() < 0.2) {
    //     throw new Error("Simulated transient processing failure");
    // }
  }

  private async runConsumer() {
    await this.consumer.run({
      autoCommit: false,           // Crucial: Desabilita commits automáticos de offset [1, 2]
      eachBatchAutoResolve: false, // Crucial: Desabilita auto-resolução após eachBatch [1, 2, 3]
      partitionsConsumedConcurrently: 1, // Garante processamento sequencial por partição (padrão, mas explícito) [1, 4, 2]

      // Ajusta os timeouts internos do Kafka como uma rede de segurança.
      // Estes devem ser significativamente maiores que o seu tempo de processamento de 10 segundos.
      // max.poll.interval.ms: 60000, // Padrão é 5 minutos (300000), 60s é um bom buffer para 10s de processamento [5, 6]
      // session.timeout.ms: 30000,   // Padrão é 45s (Kafka v3.0+), 30s está bom [5]
      // heartbeat.interval.ms: 10000, // Padrão é 3s, 10s está bom se < session.timeout.ms [5]

      eachBatch: async ({ batch, resolveOffset, heartbeat }: EachBatchPayload) => {
        // Se o worker já estiver ocupado, pausa esta partição e retorna.
        // O consumidor permanecerá pausado até ser explicitamente retomado.
        if (this.isWorkerBusy) {
          console.log(` Worker ocupado. Pausando a partição ${batch.partition} do tópico ${batch.topic}.`);
          this.consumer.pause([{ topic: batch.topic, partitions: [batch.partition] }]); [1]
          await heartbeat(); // Garante que os heartbeats continuem enquanto pausado [5, 2]
          return; // Sai do eachBatch, ele será chamado novamente quando retomado
        }

        // Garante que haja mensagens no lote
        if (batch.messages.length === 0) {
          return;
        }

        // Para "uma mensagem por vez", processamos apenas a primeira mensagem do lote.
        // Note que batch.messages é um array, mesmo que partitionsConsumedConcurrently: 1
        // ainda pode haver mais de uma mensagem no lote se o poll retornar várias.
        // A lógica abaixo garante que apenas UMA mensagem seja processada por vez.
        const messageToProcess = batch.messages;

        // 1. Marca o worker como ocupado
        this.isWorkerBusy = true;

        try {
          // 2. Pausa o consumidor para esta partição específica imediatamente.
          // Isso impede a busca de mais mensagens para o buffer enquanto a atual está sendo processada.
          this.consumer.pause([{ topic: batch.topic, partitions: [batch.partition] }]); [1]
          console.log(` Partição ${messageToProcess.partition} do tópico ${batch.topic} pausada para processar a mensagem offset: ${messageToProcess.offset}`);

          // 3. Executa a tarefa de processamento de longa duração
          await this.simulateLongProcessing(messageToProcess);

          // 4. Se o processamento for bem-sucedido, resolve o offset para *esta* mensagem.
          // Isso a marca explicitamente como consumida.
          resolveOffset(messageToProcess.offset); [1, 2]
          console.log(` Offset ${messageToProcess.offset} processado e resolvido com sucesso.`);

        } catch (error) {
          console.error(` Erro ao processar a mensagem offset ${messageToProcess.offset}:`, error.message);
          // 5. Em caso de falha, NÃO chame resolveOffset().
          // Este é o "não-reconhecimento". A mensagem NÃO será marcada como consumida.
          // O Kafka reentregará esta mensagem (e potencialmente mensagens após ela no lote)
          // se o consumidor reiniciar ou rebalancear, ou se a partição for reatribuída.
          // Implementar lógica de retry ou estratégia de DLQ em seção avançada.
        } finally {
          // 6. Marca o worker como livre
          this.isWorkerBusy = false;

          // 7. Retoma o consumidor para esta partição para buscar a próxima mensagem.
          this.consumer.resume([{ topic: batch.topic, partitions: [batch.partition] }]); [1]
          console.log(` Partição ${batch.partition} do tópico ${batch.topic} retomada.`);
        }

        // É uma boa prática enviar um heartbeat periodicamente, especialmente durante longos awaits.
        // O handler eachBatch do KafkaJS geralmente lida com isso, mas a chamada explícita é uma salvaguarda.
        await heartbeat(); [5, 2]
      },
    });
  }
}