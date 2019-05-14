'use strict';

module.exports = class DbCleaner {
  static create(db) {
    return new DbCleaner(db);
  }

  constructor(db) {
    this._db = db;
  }

  async tearDown() {
    return Promise.all([this._db.raw('DROP TABLE IF EXISTS programs')]);
  }
};
