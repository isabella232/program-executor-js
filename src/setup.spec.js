'use strict';

require('dotenv').config({ silent: true });

const knex = require('knex');
const sinon = require('sinon');
const chai = require('chai');
const sinonChai = require('sinon-chai');
const chaiSubset = require('chai-subset');
const chaiString = require('chai-string');
const chaiAsPromised = require('chai-as-promised');
const Logger = require('@emartech/json-logger').Logger;

const DbCleaner = require('./test-helper/db-cleaner');

chai.use(chaiSubset);
chai.use(sinonChai);
chai.use(chaiString);
chai.use(chaiAsPromised);

global.expect = chai.expect;

before(function() {
  this.db = knex({
    client: 'pg',
    connection: process.env.DATABASE_URL || process.env.DATABASE_TEST_URL
  });
});

beforeEach(async function() {
  this.sinon = sinon;
  this.sandbox = sinon.createSandbox();

  this.loggerLog = this.sandbox.stub(Logger.prototype, 'error');

  this.sandbox.stub(Logger.prototype, 'trace');
  this.sandbox.stub(Logger.prototype, 'debug');
  this.infoStub = this.sandbox.stub(Logger.prototype, 'info');
  this.warnStub = this.sandbox.stub(Logger.prototype, 'warn');
  this.sandbox.stub(Logger.prototype, 'fromError');
  this.sandbox.stub(Logger.prototype, 'warnFromError');
  this.sandbox.stub(Logger.prototype, 'fatal');

  await DbCleaner.create(this.db).tearDown();
});

afterEach(async function() {
  this.sandbox.restore();
  await DbCleaner.create(this.db).tearDown();
});
