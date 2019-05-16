'use strict';

class IgnorableError extends Error {
  constructor(message, code) {
    super();
    this.message = message;
    this.code = code;
    this.response = { status: code };
    IgnorableError.decorate(this);
  }

  static decorate(error) {
    error.ignorable = true;
    return error;
  }

  static isIgnorable(error) {
    return !!error.ignorable;
  }
}

module.exports = IgnorableError;
