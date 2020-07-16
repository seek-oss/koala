import Koa from 'koa';

import { lazyLoad } from './asyncMiddleware';

describe('asyncMiddleware', () => {
  const makeCtx = (fields: Record<string, unknown> = {}): Koa.Context =>
    (({
      state: {},
      method: 'GET',
      ...fields,
    } as unknown) as Koa.Context);

  const next = jest.fn().mockRejectedValue(new Error('why are you here'));

  it('should cache a successfully initialised inner middleware', async () => {
    const ctx: Koa.Context = makeCtx();

    const innerMiddleware = jest
      .fn()
      .mockImplementationOnce(() => (ctx.status = 201))
      .mockImplementationOnce(() => (ctx.status = 202));
    const createInnerMiddleware = jest.fn().mockResolvedValue(innerMiddleware);
    const middleware = lazyLoad(createInnerMiddleware);

    await expect(middleware(ctx, next)).resolves.toBe(201);
    expect(ctx.status).toBe(201);

    expect(createInnerMiddleware).toHaveBeenCalledTimes(1);
    expect(innerMiddleware).toHaveBeenCalledTimes(1);

    await expect(middleware(ctx, next)).resolves.toBe(202);
    expect(ctx.status).toBe(202);

    expect(createInnerMiddleware).toHaveBeenCalledTimes(1);
    expect(innerMiddleware).toHaveBeenCalledTimes(2);
  });

  it('should retry inner middleware initialisation on failure', async () => {
    const ctx: Koa.Context = makeCtx();
    const err = new Error('middleware initialisation failed!');

    const innerMiddleware = jest.fn(() => (ctx.status = 201));
    const createInnerMiddleware = jest
      .fn()
      .mockRejectedValueOnce(err)
      .mockResolvedValue(innerMiddleware);
    const middleware = lazyLoad(createInnerMiddleware);

    await expect(middleware(ctx, next)).rejects.toThrow(err);
    expect(ctx.status).not.toBe(201);

    expect(createInnerMiddleware).toHaveBeenCalledTimes(1);

    await expect(middleware(ctx, next)).resolves.toBe(201);
    expect(ctx.status).toBe(201);

    expect(createInnerMiddleware).toHaveBeenCalledTimes(2);
  });

  it('should cache a new inner middleware on expired TTL', async () => {
    const ctx: Koa.Context = makeCtx();
    const ttl = 60_000;

    const currentTime = jest.spyOn(Date, 'now');

    const innerMiddleware = jest
      .fn()
      .mockImplementationOnce(() => (ctx.status = 201))
      .mockImplementationOnce(() => (ctx.status = 202))
      .mockImplementationOnce(() => (ctx.status = 203));
    const init = jest.fn().mockResolvedValue(innerMiddleware);
    const middleware = lazyLoad(init, ttl);

    currentTime.mockReturnValue(0);

    await expect(middleware(ctx, next)).resolves.toBe(201);
    expect(ctx.status).toBe(201);

    expect(init).toHaveBeenCalledTimes(1);
    expect(innerMiddleware).toHaveBeenCalledTimes(1);

    currentTime.mockReturnValue(1000);

    await expect(middleware(ctx, next)).resolves.toBe(202);
    expect(ctx.status).toBe(202);

    expect(init).toHaveBeenCalledTimes(1);
    expect(innerMiddleware).toHaveBeenCalledTimes(2);

    currentTime.mockReturnValue(80_000);
    await expect(middleware(ctx, next)).resolves.toBe(203);
    expect(ctx.status).toBe(203);

    expect(init).toHaveBeenCalledTimes(2);
    expect(innerMiddleware).toHaveBeenCalledTimes(3);
  });
});
