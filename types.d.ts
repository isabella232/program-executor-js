/**
 * @param {object} config
 * @param {object} object.knex - Connected Knex instance
 * @param {string} object.amqpUrl - RabbitMq Url
 * @param {string} object.tableName - Table name for bookkeeping
 * @param {string} object.queueName - Queue name to publish to
 */
declare class ProgramExecutor {
    constructor(config: any);
    /**
     * @param {object} data
     * @param {object} object.programData
     * @param {array} object.jobs
     * @param {object} object.jobsData
     */
    createProgram(data: any): void;
    /**
     * @param {object} config
     * @param {object} object.knex - Connected Knex instance
     * @param {string} object.amqpUrl - RabbitMq Url
     * @param {string} object.tableName - Table name for bookkeeping
     * @param {string} object.queueName - Queue name to publish to
     */
    static create(config: any): void;
}

