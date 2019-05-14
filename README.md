# Program Executor JS

# Install

`npm i -E @emartech/program-executor`

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