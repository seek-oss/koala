import Router, { Middleware } from '@koa/router';
import Koa, { Context, Next } from 'koa';
import request from 'supertest';

import { contextFields, createMiddleware } from './requestLogging';

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
          }
        `,
        );
      });

      return createAgent(handler)
        .get('/route/foo?bar')
        .set('user-agent', 'Safari')
        .expect(200, 'hello');
    });

    it('returns request information for a @koa/router handler', () => {
      const router = new Router().get(
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
});
