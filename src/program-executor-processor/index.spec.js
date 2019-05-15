'use strict';

const ProgramExecutorProcessor = require('./');

const ProgramHandler = require('../program-handler');
const JobDataHandler = require('../job-data-handler');
const QueueManager = require('../queue-manager');

describe('ProgramExecutorProcessor', function() {
  let programHandler;
  let queueManager;

  let jobLibrary;
  let testJobExecuteStub;
  let failingJobExecuteStub;
  let failingJobExecuteWithIgnorableErrorStub;
  let failingJobExecuteWithRetryableErrorStub;
  let programHandlerIsProgramFinishedWithErrorStub;

  beforeEach(async function() {
    const ignorableError = new Error('Something wrong happened, but ignore this!');
    ignorableError.ignorable = true;
    const retryableError = new Error('Something wrong happened, but please retry!');
    retryableError.retryable = true;

    testJobExecuteStub = this.sandbox.stub();
    failingJobExecuteStub = this.sandbox.stub().rejects(new Error('Something wrong happened!'));
    failingJobExecuteWithIgnorableErrorStub = this.sandbox.stub().rejects(ignorableError);
    failingJobExecuteWithRetryableErrorStub = this.sandbox.stub().rejects(retryableError);
    jobLibrary = {
      testJob: {
        create: this.sandbox.stub().returns({
          execute: testJobExecuteStub
        })
      },
      currentJob: {
        create: this.sandbox.stub().returns({ execute() {} })
      },
      nextJob: {
        create: this.sandbox.stub().returns({ execute() {} })
      },
      failingJob: {
        create: this.sandbox.stub().returns({
          execute: failingJobExecuteStub
        })
      },
      failingJobWithIgnorableError: {
        create: this.sandbox.stub().returns({
          execute: failingJobExecuteWithIgnorableErrorStub
        })
      },
      failingJobWithRetryableError: {
        create: this.sandbox.stub().returns({
          execute: failingJobExecuteWithRetryableErrorStub
        })
      }
    };

    this.sandbox.spy(JobDataHandler, 'create');
    this.sandbox.stub(ProgramHandler.prototype, 'finishProgram').resolves(true);
    this.sandbox.stub(ProgramHandler.prototype, 'setProgramToError').resolves(true);
    this.sandbox.stub(ProgramHandler.prototype, 'setJobRetriableErrorMessage').resolves(true);
    this.sandbox.stub(ProgramHandler.prototype, 'incrementStep').resolves(true);
    this.sandbox.stub(ProgramHandler.prototype, 'incrementStepRetryCount').resolves(true);
    programHandlerIsProgramFinishedWithErrorStub = this.sandbox
      .stub(ProgramHandler.prototype, 'isProgramFinishedWithError')
      .resolves(false);

    this.sandbox.stub(QueueManager.prototype, 'queueProgram').resolves(true);

    programHandler = ProgramHandler.create();
    queueManager = QueueManager.create();
  });

  describe('process', function() {
    it('should execute job from program library when its the next job', async function() {
      const programData = {
        customerId: 123,
        hostname: 'yolo.myshopify.com'
      };

      await ProgramExecutorProcessor.create(programHandler, queueManager, jobLibrary).process({
        programData,
        jobs: ['testJob'],
        runId: '1'
      });

      expect(jobLibrary.testJob.create).to.be.calledWithExactly(programData);
      expect(testJobExecuteStub).to.be.calledWith({
        programData,
        jobs: ['testJob'],
        runId: '1'
      });
    });

    it('should pass job data handler for the given job and runId pair', async function() {
      await ProgramExecutorProcessor.create(programHandler, queueManager, jobLibrary).process({
        jobs: ['testJob'],
        programData: {},
        runId: '1'
      });

      const jobDataHandler = testJobExecuteStub.getCall(0).args[1];

      expect(JobDataHandler.create).to.be.calledWith(this.sinon.match.instanceOf(ProgramHandler), '1', 'testJob');
      expect(jobDataHandler).to.be.an.instanceOf(JobDataHandler);
    });

    it('should increment try count on process', async function() {
      await ProgramExecutorProcessor.create(programHandler, queueManager, jobLibrary).process({
        jobs: ['testJob'],
        programData: {},
        runId: '1'
      });

      expect(ProgramHandler.prototype.incrementStepRetryCount).to.have.been.calledWith('1');
    });

    it('should cancel execution if program already encountered an error', async function() {
      programHandlerIsProgramFinishedWithErrorStub.resolves(true);
      await ProgramExecutorProcessor.create(programHandler, queueManager, jobLibrary).process({
        jobs: ['testJob'],
        programData: {},
        runId: '1'
      });

      expect(testJobExecuteStub).not.to.have.been.called;
      expect(QueueManager.prototype.queueProgram).not.to.have.been.called;
    });

    it('should throw an error if a job fails with non-ignorable error', async function() {
      let caughtError;
      try {
        await ProgramExecutorProcessor.create(programHandler, queueManager, jobLibrary).process({
          jobs: ['failingJob'],
          programData: {},
          runId: '1'
        });
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError).not.to.be.undefined;
      expect(failingJobExecuteStub).to.be.called;
    });

    it('should not throw an error if a job fails with an ignorable error', async function() {
      await ProgramExecutorProcessor.create(programHandler, queueManager, jobLibrary).process({
        jobs: ['failingJobWithIgnorableError'],
        programData: {},
        runId: '1'
      });
      expect(ProgramHandler.prototype.setProgramToError).to.be.calledWith(
        '1',
        'Something wrong happened, but ignore this!'
      );
    });

    it('should set program to error if job fails with non retriable error', async function() {
      try {
        await ProgramExecutorProcessor.create(programHandler, queueManager, jobLibrary).process({
          jobs: ['failingJob'],
          programData: {},
          runId: '1'
        });
      } catch (error) {
        expect(ProgramHandler.prototype.setProgramToError).to.be.calledWith('1', 'Something wrong happened!');
        expect(ProgramHandler.prototype.setJobRetriableErrorMessage).not.have.been.called;
      }
    });

    it('should update error message only if job fails with retriable error', async function() {
      try {
        await ProgramExecutorProcessor.create(programHandler, queueManager, jobLibrary).process({
          jobs: ['failingJobWithRetryableError'],
          programData: {},
          runId: '1'
        });
      } catch (error) {
        expect(ProgramHandler.prototype.setProgramToError).not.have.been.called;
        expect(ProgramHandler.prototype.setJobRetriableErrorMessage).to.be.calledWith(
          '1',
          'Something wrong happened, but please retry!'
        );
      }
    });

    it('should requeue with the next program', async function() {
      await ProgramExecutorProcessor.create(programHandler, queueManager, jobLibrary).process({
        jobs: ['currentJob', 'nextJob'],
        programData: {
          customerId: 123,
          hostname: 'yolo.myshopify.com'
        }
      });

      expect(QueueManager.prototype.queueProgram).to.have.been.calledWith({
        jobs: ['nextJob'],
        programData: {
          customerId: 123,
          hostname: 'yolo.myshopify.com'
        }
      });
    });

    it('should call increment on requeue', async function() {
      await ProgramExecutorProcessor.create(programHandler, queueManager, jobLibrary).process({
        jobs: ['currentJob', 'nextJob'],
        programData: {},
        runId: '1'
      });

      expect(ProgramHandler.prototype.incrementStep).to.have.been.calledWith('1');
    });

    it('should not requeue when it was the last job', async function() {
      await ProgramExecutorProcessor.create(programHandler, queueManager, jobLibrary).process({
        jobs: ['currentJob'],
        programData: {},
        runId: '1'
      });

      expect(QueueManager.prototype.queueProgram).not.to.have.been.called;
    });

    it('should set program to finished when it was the last job', async function() {
      await ProgramExecutorProcessor.create(programHandler, queueManager, jobLibrary).process({
        jobs: ['currentJob'],
        programData: {},
        runId: '1'
      });

      expect(ProgramHandler.prototype.finishProgram).to.have.been.calledWith('1');
    });

    it('should not set job to finished when it was not the last job', async function() {
      await ProgramExecutorProcessor.create(programHandler, queueManager, jobLibrary).process({
        jobs: ['currentJob', 'nextJob'],
        programData: {},
        runId: '1'
      });

      expect(ProgramHandler.prototype.finishProgram).not.to.have.been.called;
    });
  });
});
