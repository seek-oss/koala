import { Middleware } from 'koa';

/**
 * Wraps an asynchronously-initialised middleware to allow it to be
 * synchronously attached to a Koa application.
 *
 * This lazy loads the function supplied through the `init` parameter at time of
 * request. If initialisation fails, the error is thrown up the chain for
 * in-flight requests, and initialisation is retried on the next request.
 * If `ttl` is set, the middleware is re-initialised when cache expires.
 *
 * @param init  - Function to asynchronously initialise a middleware
 * @param ttl - Time in ms
 */
export const lazyLoad = <State, Context>(
  init: () => Promise<Middleware<State, Context>>,
  ttl?: number,
): Middleware<State, Context> => {
  let cache: Promise<Middleware<State, Context>> | undefined;
  let cacheTimestamp: number;

  const initOrInvalidate = async () => {
    try {
      const cacheInit = await init();
      cacheTimestamp = Date.now();
      return cacheInit;
    } catch (err: unknown) {
      cache = undefined;

      throw err;
    }
  };

  const validateCache = () =>
    typeof cache === 'undefined' ||
    typeof cacheTimestamp === 'undefined' ||
    typeof ttl === 'undefined' ||
    Date.now() - cacheTimestamp < ttl ||
    (cache = undefined);

  return async (ctx, next) => {
    validateCache();
    const middleware = await (cache ?? (cache = initOrInvalidate()));

    return middleware(ctx, next) as unknown;
  };
};
