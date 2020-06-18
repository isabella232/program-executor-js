'use strict';

const camelcaseKeys = require('camelcase-keys');

class ProgramsRepository {
  constructor(db, tableName) {
    this._db = db;
    this._tableName = tableName;
  }

  async save(runId, programData, jobs, jobData) {
    await this._createTableIfNotExists(this._tableName);
    return this._db(this._tableName).insert({
      run_id: runId,
      jobs: JSON.stringify(jobs),
      step: 0,
      job_data: jobData,
      program_data: programData
    });
  }

  finishProgram(runId) {
    return this._db(this._tableName)
      .where({ run_id: runId })
      .update({ updated_at: new Date(), finished_at: new Date(), step_retry_count: 0 });
  }

  setProgramToError(runId, errorMessage, shouldSetErroredAt = true) {
    const updateQuery = { error_message: errorMessage.slice(0, 255), updated_at: new Date() };

    if (shouldSetErroredAt) {
      updateQuery.errored_at = new Date();
    }

    return this._db(this._tableName).where({ run_id: runId }).update(updateQuery);
  }

  incrementStep(runId) {
    return this._db(this._tableName)
      .where({ run_id: runId })
      .update({
        updated_at: new Date(),
        step_retry_count: 0,
        step: this._db.raw('step + 1')
      });
  }

  incrementStepRetryCount(runId) {
    return this._db(this._tableName)
      .where({ run_id: runId })
      .update({ updated_at: new Date() })
      .increment('step_retry_count', 1);
  }

  async getProgramByRunId(runId) {
    const result = await this._db(this._tableName).where({ run_id: runId }).first();

    if (!result) {
      throw new Error(`Program not found for ${runId}.`);
    }

    return camelcaseKeys(result);
  }

  setJobDataByRunId(runId, jobData) {
    return this._db(this._tableName)
      .where({ run_id: runId })
      .update({
        updated_at: new Date(),
        job_data: JSON.stringify(jobData)
      });
  }

  async getUnfinishedPrograms() {
    const result = await this._db(this._tableName).where({ finished_at: null, errored_at: null });
    return camelcaseKeys(result);
  }

  async _createTableIfNotExists(tableName) {
    const exists = await this._db.schema.hasTable(tableName);

    if (!exists) {
      await this._db.schema.createTable(tableName, function (table) {
        table.increments('id').primary();
        table.string('run_id').notNullable();
        table.jsonb('jobs').notNullable();
        table.integer('step');
        table.timestamp('finished_at');
        table.timestamp('errored_at');
        table.string('error_message');
        table.integer('step_retry_count').defaultTo(0);
        table.jsonb('job_data').defaultTo('{}');
        table.jsonb('program_data').defaultTo('{}');
        table.timestamps(false, true);

        table.index('run_id');
      });
    }
  }

  static create(db, tableName) {
    return new ProgramsRepository(db, tableName);
  }
}

module.exports = ProgramsRepository;
