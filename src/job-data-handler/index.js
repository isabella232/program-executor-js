'use strict';

class JobDataHandler {
  constructor(programHandler, runId, job) {
    this._programHandler = programHandler;
    this._runId = runId;
    this._job = job;
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

  static create(programHandler, runId, program) {
    return new JobDataHandler(programHandler, runId, program);
  }
}

module.exports = JobDataHandler;
