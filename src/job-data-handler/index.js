'use strict';

const ExecutionTimeExceededError = require('../execution-time-exceeded-error');

class JobHandler {
  constructor(programHandler, runId, job) {
    this._programHandler = programHandler;
    this._runId = runId;
    this._job = job;
    this._executionStarted = new Date();
  }

  get() {
    return this._programHandler.getJobData(this._runId, this._job);
  }

  set(newJobData) {
    return this._programHandler.updateJobData(this._runId, this._job, newJobData);
  }

  merge(partialJobData) {
    return this._programHandler.updateJobData(this._runId, this._job, partialJobData, true);
  }

  async checkpoint(partialJobData, maxExecutionTime) {
    await this.merge(partialJobData);
    const elapsedTime = new Date() - this._executionStarted;

    if (maxExecutionTime && elapsedTime > maxExecutionTime) {
      throw new ExecutionTimeExceededError(`Execution time exceeded (${elapsedTime} ms)`);
    }
  }

  static create(programHandler, runId, program) {
    return new JobHandler(programHandler, runId, program);
  }
}

module.exports = JobHandler;
