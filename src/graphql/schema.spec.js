'use strict';

const { graphql } = require('graphql');
const ProgramsRepository = require('../repositories/programs');
const schema = require('./schema');

describe('schema', function () {
  describe('with empty database', () => {
    it('returns with empty array when table does not exist (error code 42P01)', async function () {
      const query = `
      {
        programs {
          id
        }
      }`;

      const { data } = await graphql(schema, query, {}, { knex: this.db, tableName: 'programs' });
      expect(data).to.eql({ programs: [] });
    });
  });

  describe('with programs in database', () => {
    const programs = [
      {
        runId: '1',
        programData: { foo: 'bar' },
        jobs: ['a', 'b']
      },
      {
        runId: '2',
        programData: { bar: 'baz' },
        jobs: ['errored_job'],
        jobData: { data1: 1, data2: 2 },
        step: 0,
        erroredAt: new Date(),
        errorMessage: 'someErrorMessage',
        stepRetryCount: 1
      },
      {
        runId: '3',
        programData: { bar: 'baz' },
        jobs: ['finished_job'],
        jobData: { data1: 1, data2: 2 },
        step: 0,
        finishedAt: new Date(),
        errorMessage: 'someErrorMessage',
        stepRetryCount: 5
      }
    ];

    beforeEach(async function () {
      const programsRepository = new ProgramsRepository(this.db, 'programs');
      for (const program of programs) {
        await programsRepository.save(program);
      }
    });

    it('returns with programs inserted', async function () {
      const query = `{
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

      const { data } = await graphql(schema, query, {}, { knex: this.db, tableName: 'programs' });

      expect(data.programs[0]).to.containSubset({
        ...programs[0],
        jobData: JSON.stringify({}),
        programData: JSON.stringify(programs[0].programData)
      });
      expect(data.programs[0].createdAt).not.to.be.undefined;
      expect(data.programs[0].updatedAt).not.to.be.undefined;

      expect(data.programs[1]).to.containSubset({
        ...programs[1],
        jobData: JSON.stringify(programs[1].jobData),
        programData: JSON.stringify(programs[1].programData),
        erroredAt: programs[1].erroredAt.getTime().toString()
      });
      expect(data.programs[1].createdAt).not.to.be.undefined;
      expect(data.programs[1].updatedAt).not.to.be.undefined;

      expect(data.programs[2]).to.containSubset({
        ...programs[2],
        jobData: JSON.stringify(programs[2].jobData),
        programData: JSON.stringify(programs[2].programData),
        finishedAt: programs[2].finishedAt.getTime().toString()
      });
      expect(data.programs[2].createdAt).not.to.be.undefined;
      expect(data.programs[2].updatedAt).not.to.be.undefined;
    });

    describe('accepts orderBy input for `id` field', () => {
      it('supports ordering by id ASC', async function () {
        const query = `{
          programs(orderBy: {id: ASC}) {
            id
          }
        }`;

        const { data } = await graphql(schema, query, {}, { knex: this.db, tableName: 'programs' });
        const ids = data.programs.map((program) => program.id);

        expect(ids).to.eql(['1', '2', '3']);
      });

      it('supports ordering by id DESC', async function () {
        const query = `{
          programs(orderBy: {id: DESC}) {
            id
          }
        }`;

        const { data } = await graphql(schema, query, {}, { knex: this.db, tableName: 'programs' });
        const ids = data.programs.map((program) => program.id);

        expect(ids).to.eql(['3', '2', '1']);
      });
    });

    describe('accepts filters', () => {
      it('supports filtering for in progress only', async function () {
        const query = `{
          programs(filter: {inProgressOnly: true }) {
            id
          }
        }`;

        const { data } = await graphql(schema, query, {}, { knex: this.db, tableName: 'programs' });
        const ids = data.programs.map((program) => program.id);

        expect(ids).to.eql(['1']);
      });

      it('supports filtering for programs with step retry count greater than a given input', async function () {
        const query = `{
          programs(filter: {stepRetryCountGte: 4 }) {
            id
          }
        }`;

        const { data } = await graphql(schema, query, {}, { knex: this.db, tableName: 'programs' });
        const ids = data.programs.map((program) => program.id);

        expect(ids).to.eql(['3']);
      });
    });
  });
});
