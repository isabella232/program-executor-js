# Program Executor JS
Program executor is a scalable, resilient job framework that is capable of concurrently executing programs, while jobs inside a program are executed in order. Execution can be distributed between resources (multiple workers/threads). It is fault tolerant by storing its progress, so it can continue execution in case of failures.

# Prerequisites
* NodeJS 7.10.1+
* RabbitMQ
* Database (Postgres, MSSQL, MySQL, MariaDB, SQLite3, Oracle, and Amazon Redshift) and a connected [knex](https://knexjs.org/#Installation-client) instance

# Install
`npm i -E @emartech/program-executor`


# Usage

## Configuration
| Config | Required | Description |
| --- |:----:|----|
| `knex` | true | Connected `knex` instance ([docs](https://knexjs.org/#Installation-client)).
| `amqpUrl` | true | Connection string for RabbitMQ instance.
| `tableName` | true | The name of the table to store bookkeeping data. The table is created automatically if it does not exist.
| `queueName` | true | RabbitMQ queue used by the executor. The queue is created automatically if it does not exist.

```javascript
const ProgramExecutor = require('@emartech/program-executor');

const config = {
  knex: require('knex')({
    client: 'mysql',
    connection: {
      host: '127.0.0.1',
      user: 'your_database_user',
      password: 'your_database_password',
      database: 'myapp_test'
    }
  }),
  amqpUrl: 'amqp://guest:guest@localhost:9999',
  tableName: 'programs',
  queueName: 'program-executor'
};

const programExecutor = ProgramExecutor.create(config);
```

## How to create a program

Creating a program will add a row to the database table and insert a message into the program queue. A unique `runId` will be returned, that can be used to query the table and track progress.

| Config | Required | Type | Description |
| --- |:----:|----|----|
| `jobs` | true | Array\<String\> | Ordered list of job names to be executed.
| `programData` | false | Object | Optional data available for all jobs.
| `jobsData` | false | Object | Optional job specific data keyed by job name.


```javascript
const runId = await this._programExecutor.createProgram({
  jobs: ['first_job', 'second_job'],
  programData: {
    global: 'data for every job'
  },
  jobData: {
    first_job: {
      property: 'value for first job only'
    },
    second_job: {
      property: 'value for second job only'
    }
  }
});
```

## How to execute programs

In a long-running process (e. g. [throng](https://github.com/hunterloftis/throng)) call `processPrograms` with a collection of executable jobs (see [Job Library](#job-library)).

```javascript
const throng = require('throng');
const jobLibrary = require('../../../lib/jobs');

throng(id => {
  ProgramExecutor.create(config).processPrograms(jobLibrary);
});
```
## Built-in logging
TBD

# Progam
A program is a list of jobs to be executed in serial order. Jobs may depend on other job's results higher in the order, beacuse of the serial execution. **If any job fails to execute successfully the program will be cancelled, the error will be logged and the remaining jobs will be skipped.**

Programs can be executed concurrently, therefore cannot depend on each other. However a job in a program may start another program.

## Bookkeeping

The following information will be managed for every program in the configured database table:

| Column | Type | Description |
| --- |:----:|---|
| id  | Integer | Increment id.
| run_id | String | Generated UUID of the program.
| program_data | Object | Data available for all jobs.
| jobs |  Array\<String\> | Ordered list of job names to be executed.
| job_data | Object | Job specific data keyed by job name.
| step | Integer | Index of the currently executed job. On program error it indicates the job index where the error happened.
| step_retry_count | Integer | Indicates the retry count of the current job.
| finished_at      | Date | Filled in **only** if the program completed successfully.
| errored_at       | Date | Filled in **only** if the program failed permanently.
| error_message    | String | Contains the message of the last caught error. May be a retryable error message, but in this case `errored_at` will not be filled.
| created_at | Date | Timestamp of program creation.

# Job
## Anatomy, interface
## Program data in consturctor
## Job data, get/set methods
## Error handling
### Unexpected errors
### Retryable errors
### Ignorable errors

# Job library
Job Library is a javascript object containing jobs identified by the job name. Program executor instatiates and executes jobs from the library while working on a program.

## Anatomy
```javascript
class FirstJob {
  static get name() { return 'first_job'; }
  async create() { ... }
  async execute() { ... }
}

class SecondJob {
  static get name() { return 'second_job'; }
  async create() { ... }
  async execute() { ... }
}

const jobLibrary = {
  [FirstJob.name]: FirstJob,
  // ... or manually
  'second_job': SecondJob
}
```

## Helper script to re-export every job from given sub-directories
```javascript
const glob = require('glob');
const path = require('path');

glob.sync('./server/lib/jobs/+(common|other|folders)/*/index.js').forEach(function(file) {
  const job = require(path.resolve(file));
  const jobName = job.name;

  if (module.exports[job.name]) {
    console.log(`${job.name} job already exists, please choose a unique name!\n\n`);
  }

  module.exports[jobName] = job;
});
```
# Manually stopping a program

# Development
## Default Commit Message Format

This module ships with the [AngularJS Commit Message Conventions](https://docs.google.com/document/d/1QrDFcIiPjSLDn3EL15IJygNPiHORgU1_OOAqWjiDU5Y/edit) and changelog generator, but you can [define your own](#plugins) style.

Each commit message consists of a **header**, a **body** and a **footer**.  The header has a special
format that includes a **type**, a **scope** and a **subject** and a **JIRA ticket id**:

```
<type>(<scope>): <subject>
<BLANK LINE>
<body> - <JIRA ticket id>
<BLANK LINE>
<footer>
```

[Full explanation](https://github.com/ajoslin/conventional-changelog/blob/master/conventions/angular.md)

## Use dev version without releasing
- Run `npm link` command to create a symlink
- In the other location (eg. ..-connector-service) run `npm link @emartech/program-executor`
- Now any changes to the lib will be reflected in the service 🎉
- To check if the package is linked run `npm ls -g --depth 0`
- To reverse run `npm unlink @emartech/program-executor && npm i -E @emartech/program-executor`


---

Copyright EMARSYS 2019 All rights reserved.