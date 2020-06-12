import Koa from 'koa';

import { agentFromApp } from '../testing/server';

import { handle, thrown } from './errorMiddleware';

describe('errorMiddleware', () => {
  const mockPrev = jest.fn<unknown, [Koa.Context, Koa.Next]>();
  const mockNext = jest.fn<unknown, [Koa.Context, Koa.Next]>();

  const app = new Koa().use(mockPrev).use(handle).use(mockNext);

  const agent = agentFromApp(app);

  beforeAll(agent.setup);

  beforeEach(() => mockPrev.mockImplementation((_, next) => next()));

  afterEach(mockPrev.mockReset);
  afterEach(mockNext.mockReset);

  afterAll(agent.teardown);

  it('passes through a returned 2xx', async () => {
    mockNext.mockImplementation((ctx) => {
      ctx.status = 200;
      ctx.body = 'good';
    });

    await agent().get('/').expect(200, 'good');
  });

  it('passes through a returned 5xx', async () => {
    mockNext.mockImplementation((ctx) => {
      ctx.status = 500;
      ctx.body = 'evil';
    });

    await agent().get('/').expect(500, 'evil');
  });

  it('provides thrown error to higher middleware', async () => {
    expect.assertions(1);

    mockPrev.mockImplementation(async (ctx, next) => {
      await next();

      expect(thrown(ctx)).toEqual(expect.any(Error));
    });

    mockNext.mockImplementation((ctx) => {
      ctx.throw(400, 'bad');
    });

    await agent().get('/').expect(400, 'bad');
  });

  it('exposes a thrown 4xx error', async () => {
    mockNext.mockImplementation((ctx) => {
      ctx.throw(400, 'bad');
    });

    await agent().get('/').expect(400, 'bad');
  });

  it('redacts a thrown 5xx error', async () => {
    mockNext.mockImplementation((ctx) => {
      ctx.throw(500, 'bad');
    });

    await agent().get('/').expect(500, '');
  });

  it('handles directly-thrown error', async () => {
    mockNext.mockImplementation(() => {
      throw new Error('bad');
    });

    await agent().get('/').expect(500, '');
  });

  it('handles null error', async () => {
    mockNext.mockImplementation(() => {
      /* eslint-disable-next-line no-throw-literal */
      throw null;
    });

    await agent().get('/').expect(500, '');
  });

  it('handles string error', async () => {
    mockNext.mockImplementation(() => {
      /* eslint-disable-next-line no-throw-literal */
      throw 'bad';
    });

    await agent().get('/').expect(500, '');
  });
});
