import { Context, Middleware } from 'koa';

/**
 * @see {@link https://github.com/microsoft/TypeScript/issues/1863}
 */
const ERROR_STATE_KEY = (Symbol('seek-koala-error') as unknown) as string;

const isObject = (value: unknown): value is Record<PropertyKey, unknown> =>
  typeof value === 'object' && value !== null;

/**
 * Catches errors thrown from downstream middleware, as specified here:
 *
 * https://github.com/koajs/koa/wiki/Error-Handling#catching-downstream-errors
 *
 * This tries to extract a numeric error `status` to serve as the response
 * status, and will set the error message as the response body for non-5xx
 * statuses. It works well with Koa's built-in `ctx.throw`.
 *
 * All caught errors are emitted to the `error` event:
 *
 * ```javascript
 * app.on('error', (err, ctx) => {});
 * ```
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
  } catch (err) {
    ctx.state[ERROR_STATE_KEY] = err as unknown;

    ctx.app.emit('error', err, ctx);

    if (!isObject(err) || typeof err.status !== 'number') {
      ctx.status = 500;
      ctx.body = '';
      return;
    }

    ctx.status = err.status;
    ctx.body = (err.status < 500 && err.message) || '';
  }
};

/**
 * Retrieve the error caught by `ErrorMiddleware` from state.
 *
 * This is useful if you want to do something with the error higher up in the
 * middleware chain.
 */
export const thrown = (ctx: Context): unknown =>
  ctx.state[ERROR_STATE_KEY] as unknown;
