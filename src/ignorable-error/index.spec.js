'use strict';

const IgnorableError = require('./');

describe('IgnorableError', () => {
  it('should have a retryable property set to true', () => {
    try {
      throw new IgnorableError();
    } catch (error) {
      expect(error.ignorable).to.be.true;
    }
  });

  it('should have a message and a code', () => {
    try {
      throw new IgnorableError('Something bad happened!', 200);
    } catch (error) {
      expect(error.message).to.eql('Something bad happened!');
      expect(error.code).to.eql(200);
    }
  });

  it('should have an isIgnorable method', () => {
    try {
      throw new IgnorableError('Something bad happened!');
    } catch (error) {
      expect(IgnorableError.isIgnorable(error)).to.eql(true);
    }
  });
});
