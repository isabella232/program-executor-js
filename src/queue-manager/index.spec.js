'use strict';

const QueueManager = require('./');
const RabbitMq = require('@emartech/rabbitmq-client').RabbitMq;

const testAmqpUrl = 'amqp://guest:guest@localhost:5672';
const testChannelName = 'program-executor';

describe('Queue-Manager', function() {
  let rabbitMock;

  beforeEach(function() {
    rabbitMock = {
      insert: this.sandbox.stub().resolves(true),
      insertWithGroupBy: this.sandbox.stub().resolves(true)
    };

    this.sandbox.stub(RabbitMq, 'create').resolves(rabbitMock);
  });

  describe('queueProgram', function() {
    it('should add proper queue item to the given channel', async function() {
      const queueManager = new QueueManager(testAmqpUrl, testChannelName);
      const queueData = { test_data: 123 };

      await queueManager.queueProgram(queueData);

      expect(RabbitMq.create).to.have.been.calledWith(testAmqpUrl, testChannelName);
      expect(rabbitMock.insert).to.have.been.calledWith(queueData);
    });
  });
});
