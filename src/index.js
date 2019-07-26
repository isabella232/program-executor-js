'use strict';

const consumer = require('@emartech/rabbitmq-client').Consumer;

const ProgramHandler = require('./program-handler');
const ProgramsRepository = require('./repositories/programs');
const QueueManager = require('./queue-manager');

class ProgramExecutor {
  /**
   * @param {object} config
   * @param {object} config.knex - Connected Knex instance
   * @param {string} config.amqpUrl - RabbitMq Url
   * @param {string} config.tableName - Table name for bookkeeping
   * @param {string} config.queueName - Queue name to publish to
   */
  constructor(config) {
    this._config = config;
    this._programsRepository = ProgramsRepository.create(config.knex, config.tableName);
    this._queueManager = QueueManager.create(config.amqpUrl, config.queueName);
    this._programHandler = ProgramHandler.create(this._programsRepository, this._queueManager);
  }

  /**
   * @param {object} data
   * @param {object} data.programData
   * @param {array} data.jobs
   * @param {object} data.jobsData
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
            try {
              await programExecutorProcessor.process(message);
            } catch (error) {
              ['error_message', 'error_stack'].forEach(field => {
                if (error[field]) {
                  error[field] = error[field].substring(0, 255);
                }
              });
              throw error;
            }
          }
        }
      )
      .process();
  }

  /**
   * @param {object} config
   * @param {object} config.knex - Connected Knex instance
   * @param {string} config.amqpUrl - RabbitMq Url
   * @param {string} config.tableName - Table name for bookkeeping
   * @param {string} config.queueName - Queue name to publish to
   */
  static create(config) {
    return new ProgramExecutor(config);
  }
}

module.exports = ProgramExecutor;
