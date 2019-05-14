'use strict';

const RunIdGenerator = require('./');

describe('RunId Generator', () => {
  describe('generate', () => {
    it('should return a string', () => {
      const result = RunIdGenerator.generate();
      expect(result).to.be.a('string');
    });
  });
});
