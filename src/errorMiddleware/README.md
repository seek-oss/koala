# 🐨 Error Middleware 🐨

## Introduction

Catches errors thrown from downstream middleware, as specified here:

<https://github.com/koajs/koa/wiki/Error-Handling#catching-downstream-errors>

If you use `http-errors` or Koa's built-in `ctx.throw`,
this tries to extract a numeric error `status` to serve as the response status,
and will set the error message as the response body for non-5xx statuses.

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

Some HTTP clients throw errors with a `status` property to indicate the status code of the HTTP response. If such an error was not handled by a middleware or controller further up the chain, `ErrorMiddleware.handle` will generally ignore the error status code and respond with a HTTP 500.

Most of the time, this is what you want. For example, if your server depends on an upstream service-to-service endpoint and it starts to respond with HTTP 401s, that may imply that your server is not appropriately authenticated and is at fault, and should default to a HTTP 500.

If you want to throw an error that `ErrorMiddleware.handle` will pick up to modify your response status code, you have three options:

1. Use `http-errors`

   ```typescript
   import createError from 'http-errors';

   const controller = () => {
     throw new createError.ImATeapot();
   };
   ```

2. Use `ctx.throw`

   ```typescript
   const controller = (ctx) => {
     ctx.throw(418, 'Badness!');
   };
   ```

3. Include `isJsonResponse` and `status` properties on your error

   ```typescript
   class MyCustomError extends Error {
     constructor(
       message: string,
       public isJsonResponse: boolean,
       public status: number,
     ) {
       super(message);

       this.isJsonResponse = isJsonResponse;
       this.status = status;
     }
   }

   const controller = () => {
     throw new MyCustomError('Badness!', false, 418);
   };
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
