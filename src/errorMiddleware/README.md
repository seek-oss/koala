# 🐨 Error Middleware 🐨

## Introduction

Catches errors thrown from downstream middleware, as specified here:

<https://github.com/koajs/koa/wiki/Error-Handling#catching-downstream-errors>

This tries to extract a numeric error `status` to serve as the response status,
and will set the error message as the response body for non-5xx statuses.
It works well with Koa's built-in `ctx.throw`.

This should be placed high up the middleware chain so that errors from lower middleware are handled.
It also serves to set the correct `ctx.status` for middleware that emit logs or metrics containing the response status.

## Usage

```typescript
import { ErrorMiddleware, RequestLoggingMiddleware } from 'seek-koala';

const requestLoggingMiddleware = RequestLogging.createMiddleware(
  (ctx, fields, err) => {
    const data = {
      ...fields,
      err: err ?? ErrorMiddleware.thrown(ctx),
    };

    return ctx.status < 500
      ? rootLogger.info(data, 'request')
      : rootLogger.error(data, 'request');
  },
);

app
  .use(requestLoggingMiddleware)
  .use(metricsMiddleware)
  .use(ErrorMiddleware.handle);
```

## JsonResponse

`JsonResponse` is a custom error type used by `handle` to support JSON error response bodies.
Its constructor takes a `message` string and a `body` JavaScript value.
If the request accepts JSON then the error response will include the JSON encoded `body`.

```typescript
import { ErrorMiddleware } from 'seek-koala';

ctx.throw(
  400,
  new ErrorMiddleware.JsonResponse('Bad input', {
    message: 'Bad input',
    invalidFields: { '/path/to/field': 'Value out of range' },
  }),
);
```

You can also bring your own child Error class by exposing an `isJsonResponse` property set to `true`.
