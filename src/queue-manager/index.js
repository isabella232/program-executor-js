'use strict';

const RabbitMq = require('@emartech/rabbitmq-client').RabbitMq;
const logger = require('@emartech/json-logger')('program-executor-queue-manager');

class QueueManager {
  constructor(amqpUrl, queueName) {
    this._amqpUrl = amqpUrl;
    this._queueName = queueName;
  }

  async queueProgram(queueData) {
    try {
      const rabbit = await RabbitMq.create({ default: { url: this._amqpUrl } }, this._queueName, 'default');
      rabbit.insert(queueData, { timestamp: new Date().getTime() });
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
