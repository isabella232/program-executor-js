/**
 * @param {object} config
 * @param {object} config.knex - Connected Knex instance
 * @param {string} config.amqpUrl - RabbitMq Url
 * @param {string} config.tableName - Table name for bookkeeping
 * @param {string} config.queueName - Queue name to publish to
 */
declare class ProgramExecutor {
  constructor(config: any);
  /**
   * @param {object} data
   * @param {object} data.programData
   * @param {array} data.jobs
   * @param {object} data.jobsData
   */
  createProgram(data: any): void;
  /**
   * @param {object} config
   * @param {object} config.knex - Connected Knex instance
   * @param {string} config.amqpUrl - RabbitMq Url
   * @param {string} config.tableName - Table name for bookkeeping
   * @param {string} config.queueName - Queue name to publish to
   */
  static create(config: any): void;
}
