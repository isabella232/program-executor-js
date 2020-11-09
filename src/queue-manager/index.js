'use strict';

const RabbitMq = require('@emartech/rabbitmq-client').RabbitMq;
const logger = require('@emartech/json-logger')('program-executor-queue-manager');

class QueueManager {
  constructor(amqpUrl, queueName) {
    this._amqpUrl = amqpUrl;
    this._queueName = queueName;
  }

  async queueProgram(queueData) {
    const connectionType = 'programExecutor';

    try {
      const rabbit = await RabbitMq.create(
        { [connectionType]: { url: this._amqpUrl, useConfirmChannel: true } },
        this._queueName,
        connectionType,
        {
          deadLetterExchange: '',
          deadLetterRoutingKey: `${this._queueName}-retry-60000`
        }
      );
      rabbit.insert(queueData, { timestamp: new Date().getTime() });

      try {
        await rabbit.waitForConfirms();
      } catch (error) {
        logger.fromError('confirm-error', error, { queue_data: JSON.stringify(queueData) });
      }
    } catch (error) {
      logger.fromError('queue-error', error, { queue_name: this._queueName });

      throw error;
    }
  }

  static create(amqpUrl, queueName) {
    return new QueueManager(amqpUrl, queueName);
  }
}

module.exports = QueueManager;
