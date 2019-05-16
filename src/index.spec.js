'use strict';

const ProgramExecutor = require('./');
const ProgramHandler = require('./program-handler');
const ProgramsRepository = require('./repositories/programs');
const QueueManager = require('./queue-manager');
const ProgramExecutorProcessor = require('./program-executor-processor');
const Consumer = require('@emartech/rabbitmq-client').Consumer;

const testJobLibrary = {
  firstJob: {},
  secondJob: {}
};

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

    this.sandbox.spy(ProgramExecutorProcessor, 'create');
    this.sandbox.stub(ProgramExecutorProcessor.prototype, 'process');

    this.sandbox.spy(Consumer, 'create');
    this.sandbox.stub(Consumer.prototype, 'process');
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

  describe('#processPrograms', async function() {
    it('should create program executor processor with job library', async function() {
      await ProgramExecutor.create(config).processPrograms(testJobLibrary);

      expect(ProgramExecutorProcessor.create).to.have.been.calledWith(
        this.sinon.match.instanceOf(ProgramHandler),
        this.sinon.match.instanceOf(QueueManager),
        testJobLibrary
      );

      expect(ProgramsRepository.create).to.have.been.calledWith(config.knex, config.tableName);
      expect(QueueManager.create).to.have.been.calledWith(config.amqpUrl, config.queueName);
    });

    it('should create consumer with the given rabbitMq config', async function() {
      await ProgramExecutor.create(config).processPrograms(testJobLibrary);

      expect(Consumer.create.lastCall.args[0]).to.eql({ default: { url: config.amqpUrl } });
    });

    it('should create consumer to consume the given queue', async function() {
      await ProgramExecutor.create(config).processPrograms(testJobLibrary);

      expect(Consumer.create.lastCall.args[1]).to.containSubset({ channel: config.queueName });
    });

    it('should create consumer with a logger based on the given queue name', async function() {
      await ProgramExecutor.create(config).processPrograms(testJobLibrary);

      expect(Consumer.create.lastCall.args[1]).to.containSubset({ logger: `${config.queueName}-consumer` });
    });

    it('should config consumer with prefecth count and a retry time', async function() {
      await ProgramExecutor.create(config).processPrograms(testJobLibrary);

      expect(Consumer.create.lastCall.args[1]).to.containSubset({ prefetchCount: 1, retryTime: 60000 });
    });

    it('should call the created executor when message callback fires', async function() {
      await ProgramExecutor.create(config).processPrograms(testJobLibrary);

      const onMessageFunction = Consumer.create.lastCall.args[1].onMessage;

      await onMessageFunction({ random: 'message' });

      expect(ProgramExecutorProcessor.prototype.process).to.have.been.calledWith({ random: 'message' });
    });

    it('should start processing', async function() {
      await ProgramExecutor.create(config).processPrograms(testJobLibrary);

      expect(Consumer.prototype.process).to.have.been.called;
    });
  });
});
