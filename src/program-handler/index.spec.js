'use strict';

const ProgramHandler = require('./');
const QueueManager = require('../queue-manager');
const ProgramsRepository = require('../repositories/programs');

const hostname = 'yolo.myshopify.com';
const customerId = 123;

describe('ProgramHandler', function() {
  let programsRepository;
  let queueManager;
  let queueProgramStub;

  beforeEach(async function() {
    programsRepository = ProgramsRepository.create(this.db, 'programs');
    queueManager = QueueManager.create('amqp://guest:guest@localhost:9999', 'program-executor');
    queueProgramStub = this.sandbox.stub(QueueManager.prototype, 'queueProgram').resolves(true);
  });

  describe('#createProgram', async function() {
    it('should create a program with the given jobs and program data', async function() {
      const programData = { test: 'data' };

      await ProgramHandler.create(programsRepository, queueManager).createProgram({
        programData,
        jobs: ['current_program', 'next_program']
      });

      expect(QueueManager.prototype.queueProgram).to.have.been.calledWithMatch({
        jobs: ['current_program', 'next_program'],
        programData
      });
    });

    it('should save program in db', async function() {
      const runId = await ProgramHandler.create(programsRepository, queueManager).createProgram({
        jobs: ['current_program', 'next_program']
      });
      const program = await programsRepository.getProgramByRunId(runId);

      expect(program.jobs).to.have.members(['current_program', 'next_program']);
    });

    it('should save program data in db', async function() {
      const runId = await ProgramHandler.create(programsRepository, queueManager).createProgram({
        programData: {
          hostname,
          customerId
        },
        jobs: ['current_program', 'next_program'],
        jobData: {}
      });
      const program = await programsRepository.getProgramByRunId(runId);

      expect(program.programData).to.eql({ hostname, customerId });
    });

    it('should save job data in db', async function() {
      const jobData = {
        product_sync: {
          page: 68
        }
      };

      const runId = await ProgramHandler.create(programsRepository, queueManager).createProgram({
        jobs: ['current_program', 'next_program'],
        jobData
      });
      const program = await programsRepository.getProgramByRunId(runId);

      expect(program.jobData).to.eql(jobData);
    });

    it('should generate a runid for the program', async function() {
      await ProgramHandler.create(programsRepository, queueManager).createProgram({
        jobs: ['current_program', 'next_program']
      });

      expect(queueProgramStub.lastCall.lastArg.runId).not.to.be.undefined;
    });

    it('should return the generated runid', async function() {
      const result = await ProgramHandler.create(programsRepository, queueManager).createProgram({
        jobs: ['current_program', 'next_program']
      });

      const generatedRunId = queueProgramStub.lastCall.lastArg.runId;
      expect(generatedRunId).to.eql(result);
    });
  });

  describe('#finishProgram', async function() {
    it('should set job to finished in db', async function() {
      const programHandler = ProgramHandler.create(programsRepository, queueManager);

      const runId = await programHandler.createProgram({
        programData: {},
        jobs: ['current_program', 'next_program']
      });
      await programHandler.finishProgram(runId);

      const program = await programsRepository.getProgramByRunId(runId);
      expect(program.finishedAt).not.to.be.undefined;
    });
  });

  describe('#getJobData', async function() {
    it('should get program data for runid and program name', async function() {
      const programHandler = ProgramHandler.create(programsRepository, queueManager);
      const runId = await programHandler.createProgram({
        jobs: ['current_program', 'next_program']
      });
      await programHandler.updateJobData(runId, 'product_sync', { page: 123 });

      const jobData = await programHandler.getJobData(runId, 'product_sync');
      expect(jobData).to.eql({ page: 123 });
    });
  });

  describe('#setProgramToError', async function() {
    it('should set job to errored in db', async function() {
      const programHandler = ProgramHandler.create(programsRepository, queueManager);

      const runId = await programHandler.createProgram({
        jobs: ['current_program', 'next_program']
      });
      await programHandler.setProgramToError(runId, 'Something wrong happened!');

      const program = await programsRepository.getProgramByRunId(runId);
      expect(program.erroredAt).not.to.be.undefined;
      expect(program.errorMessage).to.equal('Something wrong happened!');
    });
  });

  describe('#isProgramFinishedWithError', async function() {
    it('should return true if erroredAt is not null', async function() {
      const programHandler = ProgramHandler.create(programsRepository, queueManager);

      const runId = await programHandler.createProgram({
        jobs: ['current_program', 'next_program']
      });
      await programHandler.setProgramToError(runId, 'Something wrong happened!');

      const result = await programHandler.isProgramFinishedWithError(runId);
      expect(result).to.be.true;
    });

    it('should return false if erroredAt is null', async function() {
      const programHandler = ProgramHandler.create(programsRepository, queueManager);

      const runId = await programHandler.createProgram({
        jobs: ['current_program', 'next_program']
      });

      const result = await programHandler.isProgramFinishedWithError(runId);
      expect(result).to.be.false;
    });
  });

  describe('#setJobRetriableErrorMessage', async function() {
    it('should set program to errored in db', async function() {
      const programHandler = ProgramHandler.create(programsRepository, queueManager);

      const runId = await programHandler.createProgram({
        jobs: ['a', 'b']
      });
      await programHandler.setJobRetriableErrorMessage(runId, 'Something wrong happened!');

      const program = await programsRepository.getProgramByRunId(runId);
      expect(program.finishedAt).to.eql(null);
      expect(program.erroredAt).to.eql(null);
      expect(program.errorMessage).to.eql('Something wrong happened!');
    });
  });

  describe('#incrementStep', async function() {
    it('should increment step', async function() {
      const programHandler = ProgramHandler.create(programsRepository, queueManager);

      const runId = await programHandler.createProgram({
        jobs: ['current_program', 'next_program']
      });
      await programHandler.incrementStep(runId);

      const program = await programsRepository.getProgramByRunId(runId);
      expect(program.step).to.eql(1);
    });
  });

  describe('#incrementStepRetryCount', async function() {
    it('should increment StepRetryCount', async function() {
      const programHandler = ProgramHandler.create(programsRepository, queueManager);

      const runId = await programHandler.createProgram({
        jobs: ['current_program', 'next_program']
      });
      await programHandler.incrementStepRetryCount(runId);

      const program = await programsRepository.getProgramByRunId(runId);
      expect(program.stepRetryCount).to.eql(1);
    });
  });

  describe('#updateJobData', async function() {
    it('should update job data related to jobName', async function() {
      const programHandler = ProgramHandler.create(programsRepository, queueManager);
      const runId = await programHandler.createProgram({
        jobs: ['current_program', 'next_program']
      });

      await programHandler.updateJobData(runId, 'contact-sync', { page: 10 });

      const program = await programsRepository.getProgramByRunId(runId);
      expect(program.jobData).to.eql({
        'contact-sync': { page: 10 }
      });
    });
  });
});
