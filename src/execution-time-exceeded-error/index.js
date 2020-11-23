'use strict';

class ExecutionTimeExceededError extends Error {
  constructor(message) {
    super();
    this.message = message;
    ExecutionTimeExceededError.decorate(this);
  }

  static decorate(error) {
    error.executionTimeExceeded = true;
    return error;
  }
}

module.exports = ExecutionTimeExceededError;
