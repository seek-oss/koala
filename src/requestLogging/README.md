# 🐨 Request Logging 🐨

## Introduction

This add-on facilitates logging information about requests and responses.
It's intended to work with an app-provided logger such as [pino](http://getpino.io/) or [Bunyan](https://github.com/trentm/node-bunyan).

It provides a few main features:

- [`createLoggerContext, getLoggerContext, createLoggerContextMiddleware, contextFields`](#context-logging) auto inject request based information into a logger's context
- [`createMiddleware`](#request-log) creates a Koa middleware for logging request and response information

## Context Logging

`createLoggerContext` returns a `LoggerContext` instance which is an [`AsyncLocalStorage`](https://nodejs.org/docs/latest-v16.x/api/async_context.html#asynchronous-context-tracking) instance under the hood.

`getLoggerContext` returns the stored logger context from a given `LoggerContext` instance for the current asynchronous context

`createLoggerContextMiddleware` sets the request context in a given `LoggerContext` instance. It takes a function which returns fields to include in the logger context. If no function is provided it will default to the `contextFields` function. This must be added early to the Koa middleware chain for the logger instance to be able to output context fields.

`contextFields` returns an object containing key-value pairs for the request method, route, URL, [`X-Request-Id`] and ad-hoc `X-Session-Id`.
This is intended to provide the essential information about the request;
the full request details can be correlated with the request log via `x-request-id`.

The route properties assume use of `@koa/router`, and are omitted if the expected metadata is not present on context.

The returned object can be used to construct a child logger that annotates log entries with request-specific information.
This can be accomplished using the `child` method of Bunyan or pino loggers.

`contextFields` requires access to the Koa context to generate a stable [`X-Request-Id`].
See the [TracingHeaders add-on](../tracingHeaders/README.md) for more information.

### Usage

```typescript
// This example uses pino. See the next section for a Bunyan example.
import pino from 'pino';
import { RequestLogging } from 'seek-koala';

const loggerContext = RequestLogging.createLoggerContext();

// Create a root logger with the app name and version
const logger = pino({
  name: appConfig.name,
  base: {
    version: appConfig.version,
  },
  mixin() {
    return RequestLogging.getLoggerContext(loggerContext)
  },
});

const loggerContextMiddleware = RequestLogging.createLoggerContextMiddleware(loggerContext);

const helloWorldHandler = async (ctx: Koa.Context) => {
  logger.info('About to return Hello World!');

  ctx.body = 'Hello world';
};

const router = new Router().get(
  'readGreeting',
  '/internal/:greeting',
  helloWorldHandler,
);

const app = new Koa()
  .use(loggerContextMiddleware);
  .use(router.routes())
  .use(router.allowedMethods())
```

### Example Log Entry

```jsonc
{
  "method": "GET",
  // `route` and `routeName` are present where provided by `@koa/router`
  "route": "/internal/:greeting",
  "routeName": "readGreeting",
  "url": "/internal/_helloworld",
  "x-request-id": "28f9be45-c403-476b-8351-f222318aeaf5",
  // `x-session-id` is present only where provided by the client
  "x-session-id": "49cd6fd8-3e74-42b6-b63d-ee7b13e5edf5",
  "name": "ca-example-service",
  "level": 30,
  "msg": "About to return Hello World!",
  "time": "2018-10-16T00:15:35.009Z",
  "version": "abcdefg.123"
}
```

## Request Log

`createMiddleware` records information incoming requests and outgoing responses.
It calls a provided callback for every response with a set of fields to be logged.
These fields include the [context fields](#context-fields) with the addition of the request headers, response code and latency in milliseconds.

Apps deployed using [Gantry](https://github.com/SEEK-Jobs/gantry) have similar functionality provided by [seek-auth-sidecar's access logs](https://github.com/SEEK-Jobs/seek-auth-sidecar/blob/master/docs/logging.md).
This middleware should only be used if additional fields are required beyond `seek-auth-sidecar`'s access log format.

An individual request can opt out of request logs by setting a `skipRequestLogging` property on the state.
This is useful to reduce noise from health check handlers.

Some headers can contain sensitive information such as JWTs or session cookies.
By default the request log will redact the `Authorization`, `Authenticated-User`, `Cookie`, `X-SEEK-OIDC-Identity` headers to avoid sending them to third-party logging services.
The header replacements can by configured by passing a map of the lowercased header name to its replacement to `createMiddleware`.

If an uncaught exception passes through the request log middleware it will attach `err.toString()` as the `internalErrorString` field.
This is a convenience that shouldn't be used as a replacement for error handling in handlers or `app.on('error')`.

### Usage

```typescript
// This example uses Bunyan. See the previous section for a pino example.
import bunyan from 'bunyan';
import { RequestLogging } from 'seek-koala';

const logger = bunyan.createLogger({
  name: appConfig.name,
  version: appConfig.version,
});

const requestLogMiddleware = RequestLogging.createMiddleware((ctx, fields) => {
  logger.info(
    {
      userEmail: ctx.state.userEmail,
      ...fields,
    },
    'request log',
  );
});

app.use(requestLogMiddleware);

const helloWorldHandler = async (ctx: Koa.Context) => {
  ctx.body = 'Hello world';
};

const healthCheckHandler = async (ctx: Koa.Context) => {
  ctx.state.skipRequestLogging = true;
  ctx.body = 'OK';
};
```

### Example Log Entry

```json
{
  "method": "GET",
  "url": "/internal/_smoketest",
  "x-request-id": "3ac3971e-32e1-4f01-aa2f-4c3207366142",
  "name": "ca-example-service",
  "hostname": "L3088",
  "pid": 39198,
  "level": 30,
  "latency": 881,
  "headers": {
    "authorization": "🐨 REDACTED 🙅",
    "content-type": "application/json",
    "cache-control": "no-cache",
    "postman-token": "fd26ffff-5c33-4cec-b79a-c329941cf586",
    "user-agent": "PostmanRuntime/7.3.0",
    "host": "localhost:8001",
    "connection": "keep-alive"
  },
  "status": 500,
  "internalErrorString": "ExpiredTokenException: The security token included in the request is expired",
  "err": {
    "message": "The security token included in the request is expired",
    "name": "ExpiredTokenException",
    "stack": "..."
  },
  "msg": "request log",
  "time": "2018-10-16T00:44:41.055Z",
  "v": 0
}
```

[`x-request-id`]: https://github.com/SEEK-Jobs/rfc/blob/master/RFC002-RequestIds.md
