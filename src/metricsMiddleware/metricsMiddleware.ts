import Koa from 'koa';

import { StatsD } from './statsD';

/**
 * Returns metrics tags for the passed Koa context
 *
 * Typically at least the route name should be returned. Due to the various
 * ways to perform routing in Koa there is no universal way to accomplish this.
 *
 * This is called during the response chain. This gives it access to the full
 * request and response.
 */
type TagsForContext = (ctx: Koa.Context) => Record<string, unknown> | undefined;

/**
 * Creates a new request metrics middleware
 *
 * This records a `request` histogram metric for every request. It will have
 * `http_status` and `http_status_family` tags in addition to what's returned
 * by `tagsForContext`.
 *
 * If `skipRequestLogging` is set on the state the request will not be logged.
 *
 * This should be attached early in the middleware chain to ensure metrics can
 * be recorded for requests rejected by downstream middleware and the latency
 * is inclusive.
 *
 * @param metricsClient  - Metrics client to use for recording metrics
 * @param tagsForContext - Function to return a base set of metrics tags
 */
export const create = (
  metricsClient: StatsD,
  tagsForContext: TagsForContext,
): Koa.Middleware =>
  async function metricsMiddleware(
    ctx: Koa.Context,
    next: () => Promise<unknown>,
  ): Promise<void> {
    const startTime = process.hrtime.bigint();
    let status = 500;

    try {
      await next();
      status = ctx.status;
    } finally {
      const tags = {
        http_status: `${status}`,
        http_status_family: `${Math.floor(status / 100)}xx`,
        http_method: ctx.method.toLowerCase(),
        ...tagsForContext(ctx),
      };

      const durationNanos = process.hrtime.bigint() - startTime;

      if (!ctx.state.skipRequestLogging) {
        metricsClient.timing('request', Number(durationNanos) / 1e6, tags);
      }
    }
  };
