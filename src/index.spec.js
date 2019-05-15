'use strict';

const ProgramExecutor = require('./');
const ProgramHandler = require('./program-handler');
const ProgramsRepository = require('./repositories/programs');
const QueueManager = require('./queue-manager');

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

    this.sandbox.spy(ProgramsRepository, 'create');
    this.sandbox.spy(QueueManager, 'create');
  });

  describe('#createProgram', async function() {
    it('should create program handler and call createProgram with given data', async function() {
      await ProgramExecutor.create(config).createProgram({
        jobs: ['current_program', 'next_program']
      });

      expect(ProgramHandler.create).to.have.been.calledWith(
        this.sinon.match.instanceOf(ProgramsRepository),
        this.sinon.match.instanceOf(QueueManager)
      );
      expect(ProgramsRepository.create).to.have.been.calledWith(config.knex, config.tableName);
      expect(QueueManager.create).to.have.been.calledWith(config.amqpUrl, config.queueName);
      expect(ProgramHandler.prototype.createProgram).to.have.been.calledWith({
        jobs: ['current_program', 'next_program']
      });
    });
  });
});
