'use strict';

const JobHandler = require('./');
const ExecutionTimeExceededError = require('../execution-time-exceeded-error');

describe('JobDataHandler', function () {
  let programHandlerStub;

  beforeEach(function () {
    programHandlerStub = {
      getJobData: this.sandbox.stub().resolves(true),
      updateJobData: this.sandbox.stub().resolves(true)
    };
  });

  describe('get', function () {
    it('should call getJobData with the right parameters', async function () {
      const runId = '1';
      const program = 'product_sync';

      await JobHandler.create(programHandlerStub, runId, program).get();

      expect(programHandlerStub.getJobData).to.have.been.calledWith(runId, program);
    });
  });

  describe('set', function () {
    it('should call updateJobData with the right parameters', async function () {
      const runId = '1';
      const program = 'product_sync';

      await JobHandler.create(programHandlerStub, runId, program).set({ test: 'data' });

      expect(programHandlerStub.updateJobData).to.have.been.calledWith(runId, program, { test: 'data' });
    });
  });

  describe('merge', function () {
    it('should call updateJobData with the right parameters', async function () {
      const runId = '1';
      const program = 'product_sync';

      await JobHandler.create(programHandlerStub, runId, program).merge({ test: 'data' });

      expect(programHandlerStub.updateJobData).to.have.been.calledWith(runId, program, { test: 'data' }, true);
    });
  });

  describe('checkpoint', function () {
    it('should call updateJobData with the right parameters', async function () {
      const runId = '1';
      const program = 'product_sync';

      await JobHandler.create(programHandlerStub, runId, program).checkpoint({ test: 'data' });

      expect(programHandlerStub.updateJobData).to.have.been.calledWith(runId, program, { test: 'data' }, true);
    });

    it('should throw an ExecutionTimeExceededError if execution takes longer than given duration', async function () {
      const clock = this.sandbox.useFakeTimers();
      const runId = '1';
      const program = 'product_sync';
      const maxExecutionTime = 1000;

      const jobHandler = JobHandler.create(programHandlerStub, runId, program);

      clock.tick(maxExecutionTime + 1);

      let expectedError;
      try {
        await jobHandler.checkpoint({ test: 'data' }, maxExecutionTime);
      } catch (error) {
        expectedError = error;
      }

      expect(expectedError).to.be.an.instanceof(ExecutionTimeExceededError);
      expect(expectedError.executionTimeExceeded).to.be.true;
      clock.restore();
    });

    it('should not throw an exception if execution time is shorter than given duration', async function () {
      const clock = this.sandbox.useFakeTimers();
      const runId = '1';
      const program = 'product_sync';
      const maxExecutionTime = 1000;

      const jobHandler = JobHandler.create(programHandlerStub, runId, program);

      clock.tick(maxExecutionTime - 1);

      let expectedError;
      try {
        await jobHandler.checkpoint({ test: 'data' }, maxExecutionTime);
      } catch (error) {
        expectedError = error;
      }

      expect(expectedError).to.be.undefined;
      clock.restore();
    });

    [0, null, undefined].forEach((executionTime) => {
      it('should not throw an exception if no max execution time given', async function () {
        const clock = this.sandbox.useFakeTimers();
        const runId = '1';
        const program = 'product_sync';

        const jobHandler = JobHandler.create(programHandlerStub, runId, program);

        clock.tick(99999);

        let expectedError;
        try {
          await jobHandler.checkpoint({ test: 'data' }, executionTime);
        } catch (error) {
          expectedError = error;
        }

        expect(expectedError).to.be.undefined;
        clock.restore();
      });
    });
  });
});
