'use strict';

const QueueManager = require('./');
const RabbitMq = require('@emartech/rabbitmq-client').RabbitMq;

const testAmqpUrl = 'amqp://guest:guest@localhost:5672';
const testChannelName = 'program-executor';

describe('Queue-Manager', function () {
  describe('queueProgram', function () {
    it('should add proper queue item to the given channel', async function () {
      const rabbitMock = {
        insert: this.sandbox.stub().resolves(true),
        waitForConfirms: this.sandbox.stub().resolves(true)
      };

      this.sandbox.stub(RabbitMq, 'create').resolves(rabbitMock);

      const queueManager = new QueueManager(testAmqpUrl, testChannelName);
      const queueData = { test_data: 123 };

      await queueManager.queueProgram(queueData);

      expect(RabbitMq.create).to.have.been.calledWith(
        { programExecutor: { url: testAmqpUrl, useConfirmChannel: true } },
        testChannelName
      );
      expect(rabbitMock.insert).to.have.been.calledWith(queueData);
    });

    it('should log if confirmation fails instead of throwing', async function () {
      const errorToThrow = new Error('Boom!');
      const rabbitMock = {
        insert: this.sandbox.stub().resolves(true),
        waitForConfirms: this.sandbox.stub().rejects(errorToThrow)
      };

      this.sandbox.stub(RabbitMq, 'create').resolves(rabbitMock);

      const queueManager = new QueueManager(testAmqpUrl, testChannelName);
      const queueData = { test_data: 123 };

      await queueManager.queueProgram(queueData);

      expect(this.formErrorStub).to.have.been.calledWith('confirm-error', errorToThrow);
    });
  });
});
