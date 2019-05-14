'use strict';

class RunIdGenerator {
  static generate() {
    const nanosec = process.hrtime()[1];
    return [Date.now(), nanosec].join('');
  }
}

module.exports = RunIdGenerator;
