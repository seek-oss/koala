import type Koa from 'koa';

import type { AppIdentifier } from '../types';

/**
 * Creates a middleware for attaching app version information to responses
 *
 * This has no dependencies and can be added in any order.
 */
export const create = (appID: AppIdentifier): Koa.Middleware =>
  async function versionMiddleware<T>(
    ctx: Koa.Context,
    next: () => Promise<T>,
  ): Promise<T> {
    ctx.set(
      'Server',
      appID.version ? `${appID.name}/${appID.version}` : appID.name,
    );

    if (appID.version) {
      ctx.set('X-Api-Version', appID.version);
    }

    return next();
  };
