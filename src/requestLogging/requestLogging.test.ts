import Router, { Middleware } from '@koa/router';
import Koa, { Context, Next } from 'koa';
import request from 'supertest';

import {
  Fields,
  contextFields,
  createContextStorage,
  createMiddleware,
} from './requestLogging';

describe('RequestLogging', () => {
  const createAgent = (...middlewares: Middleware[]) => {
    const app = new Koa();

    for (const middleware of middlewares) {
      app.use(middleware);
    }

    return request.agent(app.callback());
  };

  describe('contextFields', () => {
    it('returns request information for a vanilla handler', () => {
      const handler = jest.fn((ctx: Context) => {
        ctx.status = 200;
        ctx.body = 'hello';

        const fields = contextFields(ctx);

        expect(fields).toMatchInlineSnapshot(
          {
            'x-request-id': expect.any(String),
          },
          `
          Object {
            "method": "GET",
            "url": "/route/foo?bar",
            "x-request-id": Any<String>,
            "x-session-id": "8f859d2a-46a7-4b2d-992b-3da4a18b7ab5",
          }
        `,
        );
      });

      return createAgent(handler)
        .get('/route/foo?bar')
        .set('user-agent', 'Safari')
        .set('x-session-id', '8f859d2a-46a7-4b2d-992b-3da4a18b7ab5')
        .expect(200, 'hello');
    });

    it('returns request information for a @koa/router handler', () => {
      const router = new Router().get(
        'getRoute',
        '/route/:segment',
        jest.fn((ctx: Context) => {
          ctx.status = 200;
          ctx.body = 'hello';

          const fields = contextFields(ctx);

          expect(fields).toMatchInlineSnapshot(
            {
              'x-request-id': expect.any(String),
            },
            `
            Object {
              "method": "GET",
              "route": "/route/:segment",
              "routeName": "getRoute",
              "url": "/route/foo?bar",
              "x-request-id": Any<String>,
            }
          `,
          );
        }),
      );

      return createAgent(router.routes())
        .get('/route/foo?bar')
        .set('user-agent', 'Safari')
        .expect(200, 'hello');
    });

    it('returns extra fields along with the context data when the fields parameter is provided', () => {
      const router = new Router().get(
        'getRoute',
        '/route/:segment',
        jest.fn((ctx: Context) => {
          ctx.status = 200;
          ctx.body = 'hello';

          const fields = contextFields(ctx, { extra: 'field!' });

          expect(fields).toMatchInlineSnapshot(
            {
              'x-request-id': expect.any(String),
              extra: 'field!',
            },
            `
            Object {
              "extra": "field!",
              "method": "GET",
              "route": "/route/:segment",
              "routeName": "getRoute",
              "url": "/route/foo?bar",
              "x-request-id": Any<String>,
            }
          `,
          );
        }),
      );

      return createAgent(router.routes())
        .get('/route/foo?bar')
        .set('user-agent', 'Safari')
        .expect(200, 'hello');
    });
  });

  describe('createMiddleware', () => {
    it('logs a successful request', async () => {
      const handler = jest.fn((ctx: Context) => {
        ctx.status = 201;
      });

      const logMock = jest.fn();

      const middleware = createMiddleware(logMock);

      await createAgent(middleware, handler)
        .post('/my/test/service')
        .set('Authenticated-User', 'somesercret')
        .set('user-agent', 'Safari')
        .expect(201);

      expect(logMock).toBeCalledTimes(1);

      const [, fields, err] = logMock.mock.calls[0];

      expect(fields).toMatchInlineSnapshot(
        {
          headers: {
            host: expect.any(String),
          },
          latency: expect.any(Number),
          'x-request-id': expect.any(String),
        },
        `
        Object {
          "headers": Object {
            "accept-encoding": "gzip, deflate",
            "authenticated-user": "🐨 REDACTED 🙅",
            "connection": "close",
            "content-length": "0",
            "host": Any<String>,
            "user-agent": "Safari",
          },
          "latency": Any<Number>,
          "method": "POST",
          "status": 201,
          "url": "/my/test/service",
          "x-request-id": Any<String>,
        }
      `,
      );

      expect(err).toBeUndefined();
    });

    it('skips logging if the handler requests it', async () => {
      const handler = jest.fn((ctx: Context) => {
        ctx.status = 201;
        ctx.state.skipRequestLogging = true;
      });

      const logMock = jest.fn();

      const middleware = createMiddleware(logMock);

      await createAgent(middleware, handler)
        .post('/my/test/service')
        .set('Authenticated-User', 'somesercret')
        .set('user-agent', 'Safari')
        .expect(201);

      expect(logMock).not.toBeCalled();
    });

    it('logs a failed request', async () => {
      const expectedError = Error('Something tragic happened');

      // Avoid `console.error` logging
      const errorHandler = jest.fn(async (ctx: Context, next: Next) => {
        try {
          await next();
        } catch (err) {
          // Nonsense status code; the caller sees this but not the middleware
          ctx.status = 418;
        }
      });

      const handler = jest.fn(() => {
        throw expectedError;
      });

      const logMock = jest.fn();

      // Do not redact authorization
      const headerReplacements = {
        'x-custom-header': 'substitution',
        accept: undefined,
      };

      const middleware = createMiddleware(logMock, headerReplacements);

      await createAgent(errorHandler, middleware, handler)
        .post('/my/failed/service')
        .set('ACCEPT', 'image/png')
        .set('authorization', 'retain-me')
        .set('X-Custom-Header', 'foo')
        .set('user-agent', 'Safari')
        .expect(418);

      expect(logMock).toBeCalledTimes(1);

      const [, fields, err] = logMock.mock.calls[0];

      expect(fields).toMatchInlineSnapshot(
        {
          headers: {
            host: expect.any(String),
          },
          latency: expect.any(Number),
          'x-request-id': expect.any(String),
        },
        `
        Object {
          "err": [Error: Something tragic happened],
          "headers": Object {
            "accept": undefined,
            "accept-encoding": "gzip, deflate",
            "authorization": "retain-me",
            "connection": "close",
            "content-length": "0",
            "host": Any<String>,
            "user-agent": "Safari",
            "x-custom-header": "substitution",
          },
          "internalErrorString": "Error: Something tragic happened",
          "latency": Any<Number>,
          "method": "POST",
          "status": 500,
          "url": "/my/failed/service",
          "x-request-id": Any<String>,
        }
      `,
      );

      expect(err).toBe(expectedError);
    });
  });

  describe('createContextStorage', () => {
    it('returns both a createContextMiddleware and mixin function', () => {
      const { createContextMiddleware, mixin } = createContextStorage();

      expect(createContextMiddleware).toBeInstanceOf(Function);
      expect(mixin).toBeInstanceOf(Function);
    });

    it('should return an empty object if the context storage is empty', () => {
      const { mixin } = createContextStorage();

      expect(mixin()).toStrictEqual({});
    });

    it('should set the context and return the current contents of a context storage', async () => {
      const { createContextMiddleware, mixin } = createContextStorage();

      const contextMiddleware = createContextMiddleware();

      // We need to grab the result from within the run() chain
      let result: Fields = {};
      const setResultMiddleware = jest.fn(async (_ctx: Context, next: Next) => {
        result = mixin();
        await next();
      });

      const handler = jest.fn((ctx: Context) => {
        ctx.status = 201;
      });

      await createAgent(contextMiddleware, setResultMiddleware, handler)
        .post('/my/test/service')
        .set('Authenticated-User', 'somesercret')
        .set('user-agent', 'Safari')
        .set('x-session-id', '8f859d2a-46a7-4b2d-992b-3da4a18b7ab5')
        .expect(201);

      expect(result).toStrictEqual({
        method: 'POST',
        url: '/my/test/service',
        'x-request-id': expect.any(String),
        'x-session-id': '8f859d2a-46a7-4b2d-992b-3da4a18b7ab5',
      });
    });

    it('should allow for custom fields in the context', async () => {
      const { createContextMiddleware, mixin } = createContextStorage();

      const contextMiddleware = createContextMiddleware((_ctx, fields) => ({
        extra: 'field',
        ...fields,
      }));

      // We need to grab the result from within the run() chain
      let result: Fields = {};
      const setResultMiddleware = jest.fn(async (_ctx: Context, next: Next) => {
        result = mixin();
        await next();
      });

      const handler = jest.fn((ctx: Context) => {
        ctx.status = 201;
      });

      await createAgent(contextMiddleware, setResultMiddleware, handler)
        .post('/my/test/service')
        .set('Authenticated-User', 'somesercret')
        .set('user-agent', 'Safari')
        .set('x-session-id', '8f859d2a-46a7-4b2d-992b-3da4a18b7ab5')
        .expect(201);

      expect(result).toStrictEqual({
        method: 'POST',
        extra: 'field',
        url: '/my/test/service',
        'x-request-id': expect.any(String),
        'x-session-id': '8f859d2a-46a7-4b2d-992b-3da4a18b7ab5',
      });
    });

    it('should not mutate the current context if surface level fields are changed', async () => {
      const { createContextMiddleware, mixin } = createContextStorage();

      const contextMiddleware = createContextMiddleware();

      // We need to grab the result from within the run() chain
      let result: Fields = {};
      const setResultMiddleware = jest.fn(async (_ctx: Context, next: Next) => {
        const tempResult = mixin();
        tempResult.abcd = 'extra';
        result = mixin();
        await next();
      });

      const handler = jest.fn((ctx: Context) => {
        ctx.status = 201;
      });

      await createAgent(contextMiddleware, setResultMiddleware, handler)
        .post('/my/test/service')
        .set('Authenticated-User', 'somesercret')
        .set('user-agent', 'Safari')
        .set('x-session-id', '8f859d2a-46a7-4b2d-992b-3da4a18b7ab5')
        .expect(201);

      expect(result).toStrictEqual({
        method: 'POST',
        url: '/my/test/service',
        'x-request-id': expect.any(String),
        'x-session-id': '8f859d2a-46a7-4b2d-992b-3da4a18b7ab5',
      });
    });
  });
});
