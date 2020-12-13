import Koa from 'koa';

import { thrown } from '../errorMiddleware/errorMiddleware';
import { tracingFromContext } from '../tracingHeaders/tracingHeaders';

/**
 * Key-value pairs of fields to log
 */
export type Fields = Record<string, unknown>;

/**
 * Defines a set of substitutions to perform on request headers
 *
 * This is typically used to mask sensitive headers. However, it can also be
 * used to omit uninteresting headers from the request log by replacing them
 * with `undefined`.
 */
interface HeaderReplacements {
  [lowercaseName: string]: string | undefined;
}

// The Koala emoji should hopefully be a hint that:
// 1. This isn't an actual value of a header
// 2. Koala is doing the redaction
const REDACTED_HEADER = '🐨 REDACTED 🙅';

/**
 * Header substitutions for masking sensitive data
 *
 * These headers typically contain user credentials such as JWTs or session
 * cookies.
 */
export const SENSITIVE_HEADER_REPLACEMENTS: HeaderReplacements = {
  'authenticated-user': REDACTED_HEADER,
  authorization: REDACTED_HEADER,
  cookie: REDACTED_HEADER,
  'x-seek-oidc-identity': REDACTED_HEADER,
};

/**
 * Koa context state extensions for request logging
 */
export interface State {
  /**
   * Indicates a request shouldn't appear in the request log
   */
  skipRequestLogging?: boolean;
}

const replaceHeaders = (
  headers: Record<string, unknown>,
  replacements: HeaderReplacements,
): Record<string, unknown> => {
  const cleanedHeaders = {
    ...headers,
  };

  for (const headerName of Object.keys(cleanedHeaders)) {
    const normalisedHeaderName = headerName.toLowerCase();

    if (replacements.hasOwnProperty(normalisedHeaderName)) {
      cleanedHeaders[headerName] = replacements[normalisedHeaderName];
    }
  }

  return cleanedHeaders;
};

/**
 * Returns an object of request-specific log fields
 *
 * The returned object includes key-value pairs for the request method, route,
 * URL and tracing IDs. This can be used to construct a child logger that
 * annotates log entries with request-specific information.
 *
 * The route properties assume use of `@koa/router`, and are omitted if the
 * expected metadata is not present on context.
 */
export const contextFields = (ctx: Koa.Context): Fields => {
  const { adhocSessionID, requestID } = tracingFromContext(ctx);

  return {
    method: ctx.request.method,
    ...(typeof ctx._matchedRoute === 'string' && {
      route: ctx._matchedRoute,
    }),
    ...(typeof ctx._matchedRouteName === 'string' && {
      routeName: ctx._matchedRouteName,
    }),
    url: ctx.request.url,
    'x-request-id': requestID,
    ...(typeof adhocSessionID === 'string' && {
      'x-session-id': adhocSessionID,
    }),
  };
};

/**
 * Creates middleware for logging requests and their responses
 *
 * This calls `logFn` for every response with a set of fields to be logged.
 * This will typically call the app's logger with a fixed message.
 *
 * In addition to the fields returned by `contextFields` this adds the
 * request headers, response latency, final status code. In the case of
 * uncaught exceptions it will also add the error string.
 *
 * If `skipRequestLogging` is set on the state the request will not be logged.
 *
 * This should be attached early in the request chain to ensure log entries can
 * be created for requests rejected by downstream middleware and the recorded
 * latency is inclusive.
 */
export const createMiddleware = <StateT extends State, CustomT>(
  logFn: (
    ctx: Koa.ParameterizedContext<StateT, CustomT>,
    fields: Fields,
    error?: unknown,
  ) => void,
  headerReplacements: HeaderReplacements = SENSITIVE_HEADER_REPLACEMENTS,
): Koa.Middleware<StateT, CustomT> =>
  async function requestLogMiddleware(
    ctx: Koa.ParameterizedContext<StateT, CustomT>,
    next: () => Promise<unknown>,
  ): Promise<void> {
    const startTime = Date.now();

    const requestFinished = (
      resultFields: Record<string, unknown>,
      err?: unknown,
    ) => {
      if (ctx.state.skipRequestLogging) {
        return;
      }

      const latency = Date.now() - startTime;
      logFn(
        ctx,
        {
          ...(typeof err !== 'undefined' && {
            err,
            internalErrorString: String(err),
          }),
          latency,
          headers: replaceHeaders(ctx.request.header, headerReplacements),
          ...contextFields(ctx),
          ...resultFields,
        },
        err,
      );
    };

    try {
      await next();

      requestFinished({ status: ctx.response.status }, thrown(ctx));
    } catch (err: unknown) {
      requestFinished({ status: 500 }, err);

      throw err;
    }
  };
