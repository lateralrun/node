# Lateral.run × Node.js

Run your customer's code from your Node.js app.

Not familiar with Lateral.run? [Check it out](https://www.lateral.run/) and sign
up for the free plan to kick the tires.

## Installation

```bash
$ npm install lateralrun
```

## Getting Started

### Create an Instance

To start, create an instance configured with your app ID and secret:

```js
const Lateral = require('lateralrun')

const lateral = new Lateral({
  appID: '{{YOUR_APP_ID}}',
  appSecret: '{{YOUR_APP_SECRET}}',
})
```

You can also set these as the defaults so you don't have to specify them for
every new instance:

```js
const { Config } = require('lateralrun')

Config.defaults = {
  appID: '{{YOUR_APP_ID}}',
  appSecret: '{{YOUR_APP_SECRET}}',
}
```

It's highly recommended to store your app secret in an environment variable
(i.e., `process.env.LATERALRUN_APP_SECRET`) for security.

### Run (Async)

With an instance at hand, you can then run your customer's code for a specific
event, passing it any data you want:

```js
lateral.run({
  account: 12345,
  event: 'contacts.new',
  data: {
    id: 67890,
    name: 'A New Record',
    created_at: '2019-12-30T02:51:49.803Z',
  },
})
```

Notice the lack of `await`. Not only does this tell us to queue the code to run
asynchronously, but it also allows your app to continue on without waiting for
confirmation.

If you do choose to `await`, an `operation` object will be returned with details
about the queued run request.

Finally, `runAsync` can be used instead of `run` if you prefer more explicit
naming.

### Run (Sync)

Running your customer's code synchronously isn't much different:

```js
let response

try {
  response = await lateral.run({
    async: false,
    account: 12345,
    event: 'contacts.new',
    data: {
      id: 67890,
      name: 'A New Record',
      created_at: '2019-12-30T02:51:49.803Z',
    },
  })
} catch (error) {
  // Handle the error in whatever way makes sense for your use case.
}

// Do something creative with `response`.
```

The two differences are `async: false` and the use of `try...catch`. Since your
customer's code will be run during the request, it's important to handle any
error that might arise. How you choose to handle that depends on your use case –
you could silently `console.error` it out if it's not critical, or abort the
process completely and alert your customer.

If the run succeeds, `response` will be the value returned by your customer's
code. Any value that can be converted to JSON is valid, such as an object,
string, number, or boolean.

If your customer hasn't setup code for the event, `response` will be
`undefined`.

Finally, `runSync` can be used instead of `run` + `async: false` for
convenience.

### Generate an Editor URL

In addition to running your customer's code, you can also easily generate a URL
to the Lateral.run code editor:

```js
const editorURL = lateral.generateEditorURL({ account: 12345 })
```

If your app renders on the server-side, the URL can be generated and passed to
the template directly. Or, if you run a SPA or JAMstack app, you can generate
the URL and pass it through a new or existing API endpoint for your frontend to
consume.

By default, the URL is valid for 24 hours. This can be changed by passing in a
`tokenExpiresIn` value that [ms](https://github.com/zeit/ms) supports.

### Errors

There are two types of errors that can be thrown:

- `RuntimeError` if your customer's code throws an error, and
- `ServiceError` if Lateral.run itself throws an error.

Both extend `BaseError`.

If for some reason you want to differentiate between them in your error
handling, they're exported for convenience:

```js
const { RuntimeError, ServiceError } = require('lateralrun').errors

try {
  response = await lateral.run({ ... })
} catch (error) {
  if (error instanceof RuntimeError) {
    // Handle the error from your customer's code.
  }

  if (error instanceof ServiceError) {
    // Handle the error from Lateral.run itself.
  }
}
```

## Development

### Prerequisites

The only prerequisite is a compatible version of Node.js (see `engines.node` in
`package.json`).

### Dependencies

Install dependencies with npm:

```bash
$ npm install
```

### Code Style & Linting

[Prettier](https://prettier.com/) is setup to enforce a consistent code style.
It's highly recommended to
[add an integration to your editor](https://prettier.io/docs/en/editors.html)
that automatically formats on save.

[ESLint](https://eslint.org/) is setup with the
["recommended" rules](https://eslint.org/docs/rules/) to enforce a level of code
quality. It's also highly recommended to
[add an integration to your editor](https://eslint.org/docs/user-guide/integrations#editors)
that automatically formats on save.

To run via the command line:

```bash
$ npm run lint
```

## Releasing

After development is done in the `development` branch and is ready for release,
it should be merged into the `master` branch, where the latest release code
lives. [Release It!](https://github.com/release-it/release-it) is then used to
interactively orchestrate the release process:

```bash
$ npm run release
```
