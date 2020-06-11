import Koa from 'koa';

import { lazyLoad } from './asyncMiddleware';

describe('asyncMiddleware', () => {
  const makeCtx = (fields: Record<string, unknown> = {}): Koa.Context =>
    (({
      state: {},
      method: 'GET',
      ...fields,
    } as unknown) as Koa.Context);

  const ctx: Koa.Context = makeCtx();
  const next = jest.fn().mockRejectedValue(new Error('why are you here'));

  it('should cache a successfully initialised inner middleware', async () => {
    const innerMiddleware = jest.fn(() => (ctx.status = 201));
    const createInnerMiddleware = jest.fn().mockResolvedValue(innerMiddleware);
    const middleware = lazyLoad(createInnerMiddleware);

    await expect(middleware(ctx, next)).resolves.toBe(201);

    expect(createInnerMiddleware).toHaveBeenCalledTimes(1);
    expect(innerMiddleware).toHaveBeenCalledTimes(1);

    await expect(middleware(ctx, next)).resolves.toBe(201);

    expect(createInnerMiddleware).toHaveBeenCalledTimes(1);
    expect(innerMiddleware).toHaveBeenCalledTimes(2);
  });

  it('should retry inner middleware initialisation on failure', async () => {
    const err = new Error('middleware initialisation failed!');
    const innerMiddleware = jest.fn(() => (ctx.status = 201));
    const createInnerMiddleware = jest
      .fn()
      .mockRejectedValueOnce(err)
      .mockResolvedValue(innerMiddleware);
    const middleware = lazyLoad(createInnerMiddleware);

    await expect(middleware(ctx, next)).rejects.toThrow(err);

    expect(createInnerMiddleware).toHaveBeenCalledTimes(1);

    await expect(middleware(ctx, next)).resolves.toBe(201);

    expect(createInnerMiddleware).toHaveBeenCalledTimes(2);
  });
});