'use strict';

const ExecutionTimeExceededError = require('./');

describe('ExecutionTimeExceededError', () => {
  it('should have a executionTimeExceeded property set to true', () => {
    try {
      throw new ExecutionTimeExceededError();
    } catch (error) {
      expect(error.executionTimeExceeded).to.be.true;
    }
  });

  it('should have a message', () => {
    try {
      throw new ExecutionTimeExceededError('Something bad happened!');
    } catch (error) {
      expect(error.message).to.eql('Something bad happened!');
    }
  });
});
