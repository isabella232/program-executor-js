'use strict';

const ProgramExecutor = require('./');
const ProgramHandler = require('./program-handler');

describe('ProgramExecutor', function() {
  let config;

  beforeEach(async function() {
    config = {
      knex: this.db,
      tableName: 'programs',
      queueName: 'program-executor',
      amqpUrl: 'amqp://guest:guest@localhost:9999'
    };

    this.sandbox.spy(ProgramHandler, 'create');
    this.sandbox.stub(ProgramHandler.prototype, 'createProgram');
  });

  describe('#createProgram', async function() {
    it('should create program handler with config and call createProgram with given data', async function() {
      await ProgramExecutor.create(config).createProgram({
        jobs: ['current_program', 'next_program']
      });

      expect(ProgramHandler.create).to.have.been.calledWith(config);
      expect(ProgramHandler.prototype.createProgram).to.have.been.calledWith({
        jobs: ['current_program', 'next_program']
      });
    });
  });
});
