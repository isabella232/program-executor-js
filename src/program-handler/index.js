'use strict';

const RunIdGenerator = require('../runid-generator');

class ProgramHandler {
  constructor(programsRepository, queueManager) {
    this._programsRepository = programsRepository;
    this._queueManager = queueManager;
  }

  async createProgram({ programData, jobs, jobData = {} }) {
    const runId = RunIdGenerator.generate();
    await this._programsRepository.save({ runId, programData, jobs, jobData });
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

  async updateJobData(runId, jobName, payload, merge = false) {
    const program = await this._programsRepository.getProgramByRunId(runId);
    const { jobData } = program;

    jobData[jobName] = merge ? { ...jobData[jobName], ...payload } : payload;

    return this._programsRepository.setJobDataByRunId(runId, jobData);
  }

  static create(programsRepository, queueManager) {
    return new ProgramHandler(programsRepository, queueManager);
  }
}

module.exports = ProgramHandler;
