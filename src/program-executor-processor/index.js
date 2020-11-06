'use strict';

const logger = require('@emartech/json-logger')('program-executor');
const JobDataHandler = require('../job-data-handler');

class ProgramExecutorProcessor {
  constructor(programHandler, queueManager, jobLibrary) {
    this._jobLibrary = jobLibrary;
    this._programHandler = programHandler;
    this._queueManager = queueManager;
  }

  async process(message) {
    const { runId } = message;

    try {
      await this._programHandler.incrementStepRetryCount(runId);
      await this._executeNextJob(message);
    } catch (error) {
      if (error.retryable) {
        await this._programHandler.setJobRetriableErrorMessage(runId, error.message);
      } else {
        await this._programHandler.setProgramToError(runId, error.message);
      }

      if (!error.ignorable) {
        throw error;
      }
    }
  }

  async _executeNextJob(message) {
    const { programData, jobs, runId } = message;
    const currentJob = jobs[0];

    const isProgramFinishedWithError = await this._programHandler.isProgramFinishedWithError(runId);
    if (isProgramFinishedWithError) {
      this.log('execution-cancelled', { ...message });
      return;
    }

    this.log('executing-job', { ...message, currentJob });

    if (this._jobLibrary[currentJob]) {
      const jobDataHandler = JobDataHandler.create(this._programHandler, runId, currentJob);
      await this._jobLibrary[currentJob].create(programData).execute(message, jobDataHandler);
      this.log('job-finished', { ...message, currentJob });
    } else {
      this.log('job-skipped', { ...message, currentJob, level: 'warn' });
    }

    const remainingJobs = jobs.slice(1);
    if (remainingJobs.length > 0) {
      await this._queueManager.queueProgram({ ...message, jobs: remainingJobs });
      await this._programHandler.incrementStep(runId);
    } else {
      await this._programHandler.finishProgram(runId);
    }
  }

  log(action, { programData, jobs, runId, currentJob, level = 'info' }) {
    logger[level](action, { executor: { current_job: currentJob, program_data: programData, jobs, run_id: runId } });
  }

  static create(programHandler, queueManager, jobLibrary) {
    return new ProgramExecutorProcessor(programHandler, queueManager, jobLibrary);
  }
}

module.exports = ProgramExecutorProcessor;
