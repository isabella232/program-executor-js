'use strict';

const RunIdGenerator = require('../runid-generator');
const QueueManager = require('../queue-manager');
const ProgramsRepository = require('../repositories/programs');

class ProgramHandler {
  constructor({ knex, amqpUrl, tableName, queueName }) {
    this._programsRepository = ProgramsRepository.create(knex, tableName);
    this._queueManager = QueueManager.create(amqpUrl, queueName);
  }

  async createProgram({ programData, jobs, jobData = {} }) {
    const runId = RunIdGenerator.generate();
    await this._programsRepository.save(runId, programData, jobs, jobData);
    await this._queueManager.queueProgram({ jobs, programData, runId });
    return runId;
  }

  async getJobData(runId, jobName) {
    const program = await this._programsRepository.getProgramByRunId(runId);
    return program.jobData[jobName] || {};
  }

  finishProgram(runId) {
    return this._programsRepository.finishProgram(runId);
  }

  setProgramToError(runId, errorMessage) {
    return this._programsRepository.setProgramToError(runId, errorMessage);
  }

  async isProgramFinishedWithError(runId) {
    const program = await this._programsRepository.getProgramByRunId(runId);
    return program.erroredAt !== null;
  }

  setJobRetriableErrorMessage(runId, errorMessage) {
    return this._programsRepository.setProgramToError(runId, errorMessage, false);
  }

  incrementStep(runId) {
    return this._programsRepository.incrementStep(runId);
  }

  incrementStepRetryCount(runId) {
    return this._programsRepository.incrementStepRetryCount(runId);
  }

  async updateJobData(runId, jobName, payload) {
    const program = await this._programsRepository.getProgramByRunId(runId);
    const { jobData } = program;
    jobData[jobName] = payload;

    return this._programsRepository.setJobDataByRunId(runId, jobData);
  }

  static create(config) {
    return new ProgramHandler(config);
  }
}

module.exports = ProgramHandler;
