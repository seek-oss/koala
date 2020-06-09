import Koa from 'koa';

import { contextFields, createMiddleware } from './requestLogging';

describe('RequestLogging', () => {
  describe('contextFields', () => {
    it('returns fields containg request information', () => {
      const ctx = ({
        request: {
          method: 'GET',
          url: '/foo/bar?baz',
          header: {
            'user-agent': 'Safari',
          },
        },
        state: {},
      } as unknown) as Koa.Context;

      const fields = contextFields(ctx);

      expect(fields.method).toBe('GET');
      expect(fields.url).toBe('/foo/bar?baz');
      expect(fields['x-request-id']).toBeDefined();
      expect(fields.headers).toBeUndefined();
    });
  });

  describe('createMiddleware', () => {
    it('logs a successful request', async () => {
      const logMock = jest.fn();
      const ctx = ({
        request: {
          method: 'POST',
          url: '/my/test/service',
          header: {
            'Authenticated-User': 'somesercret',
            'user-agent': 'Safari',
          },
        },
        response: {
          status: 404,
        },
        state: {},
      } as unknown) as Koa.Context;

      const middleware = createMiddleware(logMock);

      await middleware(ctx, () => {
        ctx.response.status = 201;
        return Promise.resolve();
      });

      expect(logMock).toBeCalledTimes(1);

      const [logCtx, fields, error] = logMock.mock.calls[0] as unknown[];

      expect(logCtx).toBe(ctx);

      expect(typeof fields).toEqual('object');

      const fieldsObj = fields as Record<string, unknown>;
      expect(fieldsObj.latency).toBeGreaterThanOrEqual(0);
      expect(fieldsObj.status).toBe(201);
      expect(fieldsObj.headers).toEqual({
        'Authenticated-User': '🐨 REDACTED 🙅',
        'user-agent': 'Safari',
      });

      expect(error).toBeUndefined();
    });

    it('skips logging if the handler requests it', async () => {
      const logMock = jest.fn();
      const ctx = ({
        response: {
          status: 200,
        },
        state: {},
      } as unknown) as Koa.Context;

      const middleware = createMiddleware(logMock);

      await middleware(ctx, () => {
        ctx.state.skipRequestLogging = true;
        return Promise.resolve();
      });

      expect(logMock).toBeCalledTimes(0);
    });

    it('logs a failed request', async () => {
      const logMock = jest.fn();
      const ctx = ({
        request: {
          method: 'POST',
          url: '/my/failed/service',
          header: {
            ACCEPT: 'image/png',
            authorization: 'retain-me',
            'X-Custom-Header': 'foo',
          },
        },
        response: {
          status: 404,
        },
        state: {},
      } as unknown) as Koa.Context;

      const headerReplacements = {
        'x-custom-header': 'substitution',
        accept: undefined,
      };

      const middleware = createMiddleware(logMock, headerReplacements);

      const expectedError = Error('Something tragic happened');

      await expect(
        middleware(ctx, () => {
          throw expectedError;
        }),
      ).rejects.toBeDefined();

      expect(logMock).toHaveBeenCalledTimes(1);
      const [logCtx, fields, error] = logMock.mock.calls[0] as unknown[];

      expect(logCtx).toBe(ctx);

      expect(typeof fields).toEqual('object');

      const fieldsObj = fields as Record<string, unknown>;
      expect(fieldsObj.latency).toBeGreaterThanOrEqual(0);
      expect(fieldsObj.status).toBe(500);
      expect(fieldsObj.internalErrorString).toBe(
        'Error: Something tragic happened',
      );
      expect(fieldsObj.headers).toEqual({
        authorization: 'retain-me',
        'X-Custom-Header': 'substitution',
      });

      expect(error).toBe(expectedError);
    });
  });
});
