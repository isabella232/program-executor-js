'use strict';

const consumer = require('@emartech/rabbitmq-client').Consumer;

const ProgramHandler = require('./program-handler');
const ProgramsRepository = require('./repositories/programs');
const QueueManager = require('./queue-manager');

class ProgramExecutor {
  /**
   * @param {object} config
   * @param {object} object.knex - Connected Knex instance
   * @param {string} object.amqpUrl - RabbitMq Url
   * @param {string} object.tableName - Table name for bookkeeping
   * @param {string} object.queueName - Queue name to publish to
   */
  constructor(config) {
    this._config = config;
    this._programsRepository = ProgramsRepository.create(config.knex, config.tableName);
    this._queueManager = QueueManager.create(config.amqpUrl, config.queueName);
    this._programHandler = ProgramHandler.create(this._programsRepository, this._queueManager);
  }

  /**
   * @param {object} data
   * @param {object} object.programData
   * @param {array} object.jobs
   * @param {object} object.jobsData
   */
  createProgram(data) {
    return this._programHandler.createProgram(data);
  }

  processPrograms(jobLibrary) {
    const programExecutorProcessor = require('./program-executor-processor').create(
      this._programHandler,
      this._queueManager,
      jobLibrary
    );

    consumer
      .create(
        { default: { url: this._config.amqpUrl } },
        {
          logger: `${this._config.queueName}-consumer`,
          channel: this._config.queueName,
          prefetchCount: 1,
          retryTime: 60000,
          onMessage: async message => {
            await programExecutorProcessor.process(message);
          }
        }
      )
      .process();
  }

  static create(config) {
    return new ProgramExecutor(config);
  }
}

module.exports = ProgramExecutor;
