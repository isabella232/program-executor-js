'use strict';

const JobDataHandler = require('./');

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

      await JobDataHandler.create(programHandlerStub, runId, program).get();

      expect(programHandlerStub.getJobData).to.have.been.calledWith(runId, program);
    });
  });

  describe('set', function () {
    it('should call updateJobData with the right parameters', async function () {
      const runId = '1';
      const program = 'product_sync';

      await JobDataHandler.create(programHandlerStub, runId, program).set({ test: 'data' });

      expect(programHandlerStub.updateJobData).to.have.been.calledWith(runId, program, { test: 'data' });
    });
  });

  describe('merge', function () {
    it('should call updateJobData with the right parameters', async function () {
      const runId = '1';
      const program = 'product_sync';

      await JobDataHandler.create(programHandlerStub, runId, program).merge({ test: 'data' });

      expect(programHandlerStub.updateJobData).to.have.been.calledWith(runId, program, { test: 'data' }, true);
    });
  });

  describe('checkpoint', function () {
    it('should call updateJobData with the right parameters', async function () {
      const runId = '1';
      const program = 'product_sync';

      await JobDataHandler.create(programHandlerStub, runId, program).merge({ test: 'data' });

      expect(programHandlerStub.updateJobData).to.have.been.calledWith(runId, program, { test: 'data' }, true);
    });
  });
});
