'use strict';

const ProgramHandler = require('./program-handler');

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
  }

  /**
   * @param {object} data
   * @param {object} object.programData
   * @param {array} object.jobs
   * @param {object} object.jobsData
   */
  createProgram(data) {
    return ProgramHandler.create(this._config).createProgram(data);
  }

  static create(config) {
    return new ProgramExecutor(config);
  }
}

module.exports = ProgramExecutor;
