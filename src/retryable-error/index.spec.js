'use strict';

const RetryableError = require('./');

describe('RetryableError', () => {
  it('should have a retryable property set to true', () => {
    try {
      throw new RetryableError();
    } catch (error) {
      expect(error.retryable).to.be.true;
    }
  });

  it('should have a message and a code', () => {
    try {
      throw new RetryableError('Something bad happened!', 200);
    } catch (error) {
      expect(error.message).to.eql('Something bad happened!');
      expect(error.code).to.eql(200);
    }
  });

  it('should have an isRetryable method', () => {
    try {
      throw new RetryableError('Something bad happened!');
    } catch (error) {
      expect(RetryableError.isRetryable(error)).to.eql(true);
    }
  });
});
