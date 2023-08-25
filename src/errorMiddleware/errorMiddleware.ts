import { type Context, HttpError, type Middleware } from 'koa';

/**
 * @see {@link https://github.com/microsoft/TypeScript/issues/1863}
 */
const ERROR_STATE_KEY = Symbol('seek-koala-error') as unknown as string;

const isObject = (value: unknown): value is Record<PropertyKey, unknown> =>
  typeof value === 'object' && value !== null;

/**
 * Custom error type supporting JSON response bodies
 *
 * The `handle` middleware will return either `message` or `body` depending on
 * the request's `Accept` header.
 *
 * ```javascript
 * ctx.throw(400, new JsonResponse('Invalid input', { fieldName: '/foo' }));
 * ```
 */
export class JsonResponse extends Error {
  /**
   * The property used by `handle` to infer that this error contains a body that
   * can be exposed in the HTTP response.
   */
  public isJsonResponse = true as const;

  /**
   * Creates a new `JsonResponse`
   *
   * This must be passed to `ctx.throw` instead of being thrown directly.
   *
   * @param message - Plain text message used for requests preferring
   *                  `text/plain`. This is also used as the `Error` superclass
   *                  message.
   *
   * @param body - JavaScript value used for requests accepting
   *               `application/json`. This is encoded as JSON in the response.
   */
  constructor(
    message: string,
    public body: unknown,
  ) {
    super(message);
  }
}

/**
 * Catches errors thrown from downstream middleware, as specified here:
 *
 * https://github.com/koajs/koa/wiki/Error-Handling#catching-downstream-errors
 *
 * If you use `http-errors` or Koa's built-in `ctx.throw`, this tries to extract
 * a numeric error `status` to serve as the response status, and will set the
 * error message as the response body for non-5xx statuses.
 *
 * This includes support for a JSON response body by throwing an error with
 * `isJsonResponse` set to `true`. If the request accepts `application/json` the
 * error's `body` will be returned, otherwise its plain text `message`.
 *
 * This should be placed high up the middleware chain so that errors from lower
 * middleware are handled. It also serves to set the correct `ctx.status` for
 * middleware that emit logs or metrics containing the response status. For
 * this reason, we recommend a sequence like:
 *
 * ```javascript
 * app
 *   .use(requestLoggingMiddleware)
 *   .use(metricsMiddleware)
 *   .use(ErrorMiddleware.handle)
 *   .use(allTheRest);
 * ```
 */
export const handle: Middleware = async (ctx, next) => {
  try {
    return (await next()) as unknown;
  } catch (err: unknown) {
    ctx.state[ERROR_STATE_KEY] = err;

    if (
      !isObject(err) ||
      typeof err.status !== 'number' ||
      (!(err instanceof HttpError) && err.isJsonResponse === undefined)
    ) {
      ctx.status = 500;
      ctx.body = '';
      return;
    }

    ctx.status = err.status;
    const expose = err.status < 500;

    if (
      expose &&
      err.body &&
      err.isJsonResponse === true &&
      // Prefer JSON ourselves if the request has no preference
      ctx.accepts(['application/json', 'text/plain']) === 'application/json'
    ) {
      ctx.body = err.body;
      return;
    }

    ctx.body = (expose && err.message) || '';
    return;
  }
};

/**
 * Retrieve the error caught by `ErrorMiddleware.handle` from state.
 *
 * This is useful if you want to do something with the error higher up in the
 * middleware chain.
 */
export const thrown = (ctx: Context): unknown =>
  ctx.state[ERROR_STATE_KEY] as unknown;
