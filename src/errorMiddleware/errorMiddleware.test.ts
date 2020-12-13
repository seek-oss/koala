import Koa from 'koa';
import request from 'supertest';

import { JsonResponse, handle, thrown } from './errorMiddleware';

describe('errorMiddleware', () => {
  const mockPrev = jest.fn<unknown, [Koa.Context, Koa.Next]>();
  const mockNext = jest.fn<unknown, [Koa.Context, Koa.Next]>();

  const app = new Koa().use(mockPrev).use(handle).use(mockNext);

  const agent = request.agent(app.callback());

  beforeEach(() => mockPrev.mockImplementation((_, next) => next()));

  afterEach(mockPrev.mockReset);
  afterEach(mockNext.mockReset);

  it('passes through a returned 2xx', async () => {
    mockNext.mockImplementation((ctx) => {
      ctx.status = 200;
      ctx.body = 'good';
    });

    await agent.get('/').expect(200, 'good');
  });

  it('passes through a returned 5xx', async () => {
    mockNext.mockImplementation((ctx) => {
      ctx.status = 500;
      ctx.body = 'evil';
    });

    await agent.get('/').expect(500, 'evil');
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

    await agent.get('/').expect(400, 'bad');
  });

  it('exposes a thrown 4xx error', async () => {
    mockNext.mockImplementation((ctx) => {
      ctx.throw(400, 'bad');
    });

    await agent.get('/').expect(400, 'bad');
  });

  it('redacts a thrown 5xx error', async () => {
    mockNext.mockImplementation((ctx) => {
      ctx.throw(500, 'bad');
    });

    await agent.get('/').expect(500, '');
  });

  it('exposes a thrown 4xx `JsonResponse` as JSON by default', async () => {
    mockNext.mockImplementation((ctx) => {
      ctx.throw(400, new JsonResponse('Bad input', { bad: true }));
    });

    await agent.get('/').expect(400, { bad: true });
  });

  it('exposes a thrown 4xx `JsonResponse` as JSON based on `Accept`', async () => {
    mockNext.mockImplementation((ctx) => {
      ctx.throw(403, new JsonResponse('No access', { access: false }));
    });

    await agent
      .get('/')
      .set('Accept', 'application/json')
      .expect(403, { access: false });
  });

  it('exposes a thrown 4xx custom JSON response as JSON based on `Accept`', async () => {
    mockNext.mockImplementation((ctx) => {
      ctx.throw(403, { body: { access: false }, isJsonResponse: true });
    });

    await agent
      .get('/')
      .set('Accept', 'application/json')
      .expect(403, { access: false });
  });

  it('exposes a thrown 4xx `JsonResponse` as text based on `Accept`', async () => {
    mockNext.mockImplementation((ctx) => {
      ctx.throw(410, new JsonResponse('Gone away', { gone: true }));
    });

    await agent.get('/').set('Accept', 'text/plain').expect(410, 'Gone away');
  });

  it('redact a thrown 5xx `JsonResponse`', async () => {
    mockNext.mockImplementation((ctx) => {
      ctx.throw(500, new JsonResponse('Bad input', { bad: true }));
    });

    await agent.get('/').expect(500, '');
  });

  it('handles directly-thrown error', async () => {
    mockNext.mockImplementation(() => {
      throw new Error('bad');
    });

    await agent.get('/').expect(500, '');
  });

  it('handles null error', async () => {
    mockNext.mockImplementation(() => {
      /* eslint-disable-next-line no-throw-literal */
      throw null;
    });

    await agent.get('/').expect(500, '');
  });

  it('handles string error', async () => {
    mockNext.mockImplementation(() => {
      /* eslint-disable-next-line no-throw-literal */
      throw 'bad';
    });

    await agent.get('/').expect(500, '');
  });
});
