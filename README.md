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
| `knex` | true | Connected `knex` instance ([docs](https://knexjs.org/#Installation-client))
| `amqpUrl` | true | Connection string for RabbitMQ instance
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
| `jobs` | true | Array\<String\> | Ordered list of job names to be executed
| `programData` | false | Object | Optional data available for all jobs
| `jobsData` | false | Object | Optional job specific data keyed by job name


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

# Progam
## Logging alerting
## Bookkeeping

# Job
## Anatomy, interface
## Program data in consturctor
## Job data, get/set methods
## Error handling
### Unexpected errors
### Retryable errors
### Ignorable errors

# Job library
## Anatomy, example script to bulk require

# Manually stopping a program



# Usage

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