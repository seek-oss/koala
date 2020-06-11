import { Middleware } from 'koa';

/**
 * Wraps an asynchronously-initialised middleware to allow it to be
 * synchronously attached to a Koa application.
 *
 * This lazy loads the function supplied through the `init` parameter at time of
 * request. If initialisation fails, the error is thrown up the chain for
 * in-flight requests, and initialisation is retried on the next request.
 *
 * @param init  - Function to asynchronously initialise a middleware
 */
export const lazyLoad = <State, Context>(
  init: () => Promise<Middleware<State, Context>>,
): Middleware<State, Context> => {
  let cache: Promise<Middleware<State, Context>> | undefined;

  const initOrInvalidate = async () => {
    try {
      return await init();
    } catch (err) {
      cache = undefined;

      /* eslint-disable-next-line no-throw-literal */
      throw err;
    }
  };

  return async (ctx, next) => {
    const middleware = await (cache ?? (cache = initOrInvalidate()));

    return middleware(ctx, next) as unknown;
  };
};
