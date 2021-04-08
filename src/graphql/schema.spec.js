'use strict';

const { graphql } = require('graphql');
const ProgramsRepository = require('../repositories/programs');
const schema = require('./schema');

const QUERY = `
{
  programs {
    id
    runId
    jobs
    jobData
    programData
    step
    finishedAt
    erroredAt
    errorMessage
    stepRetryCount
    createdAt,
    updatedAt
  }
}`;

describe('schema', function () {
  it('returns with empty array when table does not exist (error code 42P01)', async function () {
    const { data } = await graphql(schema, QUERY, {}, { knex: this.db, tableName: 'programs' });
    expect(data).to.eql({ programs: [] });
  });

  it('returns with programs inserted', async function () {
    const repository = new ProgramsRepository(this.db, 'programs');
    const program1 = {
      runId: '12345',
      programData: { foo: 'bar' },
      jobs: ['a', 'b']
    };
    const program2 = {
      runId: '12345',
      programData: { foo: 'bar' },
      jobs: ['a', 'b'],
      jobData: { data1: 1, data2: 2 },
      step: 0,
      finishedAt: new Date(),
      erroredAt: new Date(),
      errorMessage: 'someErrorMessage',
      stepRetryCount: 1
    };
    await repository.save(program1);
    await repository.save(program2);

    const { data } = await graphql(schema, QUERY, {}, { knex: this.db, tableName: 'programs' });

    expect(data.programs[0]).to.containSubset({
      ...program1,
      jobData: JSON.stringify({}),
      programData: JSON.stringify(program1.programData)
    });
    expect(data.programs[0].createdAt).not.to.be.undefined;
    expect(data.programs[0].updatedAt).not.to.be.undefined;

    expect(data.programs[1]).to.containSubset({
      ...program2,
      jobData: JSON.stringify(program2.jobData),
      programData: JSON.stringify(program2.programData),
      finishedAt: program2.finishedAt.getTime().toString(),
      erroredAt: program2.erroredAt.getTime().toString()
    });
    expect(data.programs[1].createdAt).not.to.be.undefined;
    expect(data.programs[1].updatedAt).not.to.be.undefined;
  });
});
