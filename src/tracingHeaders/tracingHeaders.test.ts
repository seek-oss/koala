import Koa from 'koa';

import { outgoingHeaders, tracingFromContext } from './tracingHeaders';

const mockCtxWithHeaders = (header: Record<string, string>): Koa.Context =>
  ({
    request: { header },
    state: {},
  } as unknown as Koa.Context);

describe('TracingHeaders', () => {
  describe('tracingFromContext', () => {
    it('should generate a stable X-Request-Id if missing', () => {
      const mockCtx = mockCtxWithHeaders({});

      const firstTracing = tracingFromContext(mockCtx);
      expect(firstTracing.requestID).toMatch(/[a-f\-0-9]+/);
      expect(firstTracing.ecSessionID).toBeUndefined();

      const secondTracing = tracingFromContext(mockCtx);
      expect(secondTracing.requestID).toBe(firstTracing.requestID);
    });

    it('should handle only X-Request-Id', () => {
      const mockCtx = mockCtxWithHeaders({
        'x-request-id': 'MY REQUEST ID',
      });

      const tracing = tracingFromContext(mockCtx);
      expect(tracing.requestID).toBe('MY REQUEST ID');
      expect(tracing.ecSessionID).toBeUndefined();
    });

    it('should handle X-Request-Id and X-EC-SessionId', () => {
      const mockCtx = mockCtxWithHeaders({
        'x-request-id': 'MY REQUEST ID',
        'x-seek-ec-sessionid': 'MY SESSION ID',
      });

      const tracing = tracingFromContext(mockCtx);
      expect(tracing.requestID).toBe('MY REQUEST ID');
      expect(tracing.ecSessionID).toBe('MY SESSION ID');
    });
  });

  describe('outgoingHeaders', () => {
    it('should work with request ID and version', () => {
      const appID = {
        name: 'ca-example-service',
        version: '1234',
      };

      const tracing = {
        requestID: 'INCOMING REQUEST',
      };

      const actual = outgoingHeaders(appID, tracing);
      expect(actual).toEqual({
        'user-agent': 'ca-example-service/1234',
        'x-request-id': 'INCOMING REQUEST',
      });
    });

    it('should work with request ID and both event capture sessions', () => {
      const appID = {
        name: 'ca-example-service',
      };

      const tracing = {
        requestID: 'INCOMING REQUEST',
        ecSessionID: 'INCOMING SESSION',
        ecVisitorID: 'INCOMING VISITOR',
      };

      const actual = outgoingHeaders(appID, tracing);
      expect(actual).toEqual({
        'user-agent': 'ca-example-service',
        'x-request-id': 'INCOMING REQUEST',
        'x-seek-ec-sessionid': 'INCOMING SESSION',
        'x-seek-ec-visitorid': 'INCOMING VISITOR',
      });
    });

    it('should work with request ID and ad-hoc session ID', () => {
      const appID = {
        name: 'ca-example-service',
      };

      const tracing = {
        requestID: 'INCOMING REQUEST',
        adhocSessionID: 'INCOMING ADHOC SESSION',
      };

      const actual = outgoingHeaders(appID, tracing);
      expect(actual).toEqual({
        'user-agent': 'ca-example-service',
        'x-request-id': 'INCOMING REQUEST',
        'x-session-id': 'INCOMING ADHOC SESSION',
      });
    });
  });
});
