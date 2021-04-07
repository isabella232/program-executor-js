'use strict';

const ProgramsRepository = require('./programs');

const programData = {
  customerId: 1,
  hostname: 'test_data'
};

const runId = '9123434';

describe('ProgramsRepository', () => {
  let programsRepository;
  let resetUpdatedAt;

  before(function () {
    resetUpdatedAt = async (runId) => {
      const oldDate = new Date(0);
      await this.db('programs').where({ run_id: runId }).update({ updated_at: oldDate });

      return oldDate;
    };
  });

  beforeEach(function () {
    programsRepository = ProgramsRepository.create(this.db, 'programs');
  });

  describe('#save', () => {
    it('saves program', async function () {
      const jobs = ['a', 'b'];
      const jobData = { product_sync: { page: 40 } };
      const finishedAt = new Date();
      const erroredAt = new Date();
      const errorMessage = 'someErrorMessage';
      const stepRetryCount = 1;
      await programsRepository.save({
        runId,
        programData,
        jobs,
        jobData,
        step: 0,
        finishedAt,
        erroredAt,
        errorMessage,
        stepRetryCount
      });

      const result = await programsRepository.getProgramByRunId(runId);

      expect(result).to.containSubset({
        runId,
        programData,
        jobs,
        jobData,
        step: 0,
        finishedAt,
        erroredAt,
        errorMessage,
        stepRetryCount
      });
    });

    it('creates table if not exists and saves program', async function () {
      await programsRepository.save({ runId, programData, jobs: ['a'] });
      await this.db.schema.dropTable('programs');

      const jobs = ['a', 'b'];
      const jobData = { product_sync: { page: 40 } };
      await programsRepository.save({ runId, programData, jobs, jobData });

      const result = await programsRepository.getProgramByRunId(runId);

      expect(result).to.containSubset({
        runId,
        jobs,
        jobData,
        programData,
        step: 0
      });
    });
  });

  describe('#finishProgram', () => {
    it('should set finished_at and reset retry counter', async function () {
      await programsRepository.save({ runId, programData, jobs: ['a'] });
      await programsRepository.incrementStepRetryCount(runId);

      const oldDate = await resetUpdatedAt(runId);

      await programsRepository.finishProgram(runId);

      const result = await programsRepository.getProgramByRunId(runId);
      expect(result.finishedAt).not.to.eql(null);
      expect(result.stepRetryCount).to.equal(0);
      expect(result.updatedAt.toString()).not.to.equal(oldDate.toString());
    });
  });

  describe('#setProgramToError', () => {
    it('should set errored_at and error_message without setting finished_at', async function () {
      await programsRepository.save({ runId, programData, jobs: ['a'] });

      const oldDate = await resetUpdatedAt(runId);

      await programsRepository.setProgramToError(runId, 'Something wrong happened!');

      const result = await programsRepository.getProgramByRunId(runId);
      expect(result.finishedAt).to.eql(null);
      expect(result.erroredAt).not.to.eql(null);
      expect(result.errorMessage).to.eql('Something wrong happened!');
      expect(result.updatedAt.toString()).not.to.equal(oldDate.toString());
    });

    it('should set and error_message and updated_at without setting finished_at or errored_at', async function () {
      await programsRepository.save({ runId, programData, jobs: ['a'] });

      const oldDate = await resetUpdatedAt(runId);

      await programsRepository.setProgramToError(runId, 'Something wrong happened!', false);

      const result = await programsRepository.getProgramByRunId(runId);
      expect(result.finishedAt).to.eql(null);
      expect(result.erroredAt).to.eql(null);
      expect(result.errorMessage).to.eql('Something wrong happened!');
      expect(result.updatedAt.toString()).not.to.equal(oldDate.toString());
    });

    it('should trim error message', async function () {
      await programsRepository.save({ runId, programData, jobs: ['a'] });
      await programsRepository.setProgramToError(runId, 'a'.repeat(256), false);

      let errorThrown;

      try {
        await programsRepository.getProgramByRunId(runId);
      } catch (error) {
        errorThrown = error;
      }

      expect(errorThrown).to.be.undefined;
    });
  });

  describe('#incrementStep', () => {
    it('should increment step by one and reset retry counter', async function () {
      await programsRepository.save({ runId, programData, jobs: ['a'] });
      await programsRepository.incrementStepRetryCount(runId);

      const result = await programsRepository.getProgramByRunId(runId);
      expect(result.step).to.eql(0);

      const oldDate = await resetUpdatedAt(runId);
      await programsRepository.incrementStep(runId);
      const incrementedResult = await programsRepository.getProgramByRunId(runId);
      expect(incrementedResult.step).to.equal(1);
      expect(incrementedResult.stepRetryCount).to.equal(0);
      expect(incrementedResult.updatedAt.toString()).not.to.equal(oldDate.toString());
    });
  });

  describe('#incrementStepRetryCount', () => {
    it('should increment step retry counter', async function () {
      await programsRepository.save({ runId, programData, jobs: ['a'] });
      const result = await programsRepository.getProgramByRunId(runId);
      expect(result.stepRetryCount).to.eql(0);

      const oldDate = await resetUpdatedAt(runId);
      await programsRepository.incrementStepRetryCount(runId);
      const incrementedResult = await programsRepository.getProgramByRunId(runId);
      expect(incrementedResult.stepRetryCount).to.equal(1);
      expect(incrementedResult.updatedAt.toString()).not.to.equal(oldDate.toString());
    });
  });

  describe('#getProgramByRunId', () => {
    it('returns program with runId', async function () {
      const jobs = ['a', 'b'];
      await programsRepository.save({ runId, programData, jobs });

      const result = await programsRepository.getProgramByRunId(runId);

      expect(result).to.containSubset({
        runId,
        jobs,
        step: 0
      });
    });

    it('throws an error if program not found', async function () {
      await programsRepository.save({ runId, programData, jobs: [] });

      await expect(programsRepository.getProgramByRunId('NON_EXISTING_RUN_ID')).to.be.rejected;
    });
  });

  describe('#setJobDataByRunId', () => {
    it('should update jobData with the given payload', async function () {
      const jobs = ['a', 'b'];
      await programsRepository.save({ runId, programData, jobs });

      const oldDate = await resetUpdatedAt(runId);
      await programsRepository.setJobDataByRunId(runId, { product_sync: { page: 1 } });
      const result = await programsRepository.getProgramByRunId(runId);

      expect(result).to.containSubset({
        runId: runId,
        jobData: { product_sync: { page: 1 } }
      });
      expect(result.updatedAt.toString()).not.to.equal(oldDate.toString());
    });
  });

  describe('#getUnfinishedPrograms', () => {
    it('returns programs without finishedAt or erroredAt set', async function () {
      await programsRepository.save({ runId: '1', programData, jobs: [] });
      await programsRepository.save({ runId: '2', programData, jobs: [] });
      await programsRepository.save({ runId: '3', programData, jobs: [] });
      await programsRepository.setProgramToError('1', 'Something wrong happened!');
      await programsRepository.finishProgram('3');

      const result = await programsRepository.getUnfinishedPrograms();

      expect(result.length).to.equal(1);
      expect(result[0]).to.containSubset({
        runId: '2'
      });
    });
  });
});
