import { randomUUID } from 'crypto';

import type Koa from 'koa';

import type { AppIdentifier } from '../types';

const STATE_KEY = '__seek_koala_tracing';

/** HTTP header name for the request ID */
export const REQUEST_ID_HEADER = 'x-request-id';

/** HTTP header name for the event capture session ID */
export const EC_SESSION_ID_HEADER = 'x-seek-ec-sessionid';

/** HTTP header name for the event capture visitor ID */
export const EC_VISITOR_ID_HEADER = 'x-seek-ec-visitorid';

/** HTTP header name for an ad-hoc session ID */
export const ADHOC_SESSION_ID_HEADER = 'x-session-id';

/** Encapsulates the extracted tracing from an incoming request */
export interface SEEKTracing {
  /**
   * Unique identifier for a client-initiated request
   *
   * The semantics of this header is documented in SEEK RFC002.
   */
  requestID: string;

  /**
   * Optional event capture session ID
   *
   * Reflects the value of the candidate's `JobseekerSessionId` cookie.
   */
  ecSessionID?: string;

  /**
   * Optional event capture visitor ID
   *
   * Reflects the value of the candidate's `JobseekerVisitorId` cookie.
   */
  ecVisitorID?: string;

  /**
   * Optional ad-hoc session ID
   *
   * Defined contextually by the system using it.
   */
  adhocSessionID?: string;
}

const SESSION_HEADER_TO_TRACING_PROP = [
  [EC_SESSION_ID_HEADER, 'ecSessionID'],
  [EC_VISITOR_ID_HEADER, 'ecVisitorID'],
  [ADHOC_SESSION_ID_HEADER, 'adhocSessionID'],
] as const;

const generateTracing = (ctx: Koa.Context): SEEKTracing => {
  const header = ctx.request.header as Record<string, string>;

  const tracing: SEEKTracing = {
    requestID: header[REQUEST_ID_HEADER] || randomUUID(),
  };

  for (const [headerName, tracingProp] of SESSION_HEADER_TO_TRACING_PROP) {
    const headerValue = header[headerName];
    if (headerValue) {
      tracing[tracingProp] = headerValue;
    }
  }

  return tracing;
};

/**
 * Extracts tracing information from an incoming request
 *
 * If no request ID is present one will be generated and cached on the state.
 */
export const tracingFromContext = (ctx: Koa.Context): SEEKTracing => {
  const state = ctx.state as { [STATE_KEY]?: SEEKTracing };

  // We need to cache this in case we generate a new request ID
  const cachedTracing = state[STATE_KEY];
  if (typeof cachedTracing !== 'undefined') {
    return cachedTracing;
  }

  const newTracing = generateTracing(ctx);
  state[STATE_KEY] = newTracing;
  return newTracing;
};

/**
 * Generates tracing headers for an outgoing request
 *
 * This sets both the SEEK tracing headers and a distinctive `User-Agent`.
 */
export const outgoingHeaders = (
  appID: AppIdentifier,
  tracing: SEEKTracing,
): Record<string, string> => {
  const userAgent = appID.version
    ? `${appID.name}/${appID.version}`
    : `${appID.name}`;

  const headers: Record<string, string> = {
    'user-agent': userAgent,
    [REQUEST_ID_HEADER]: tracing.requestID,
  };

  for (const [headerName, tracingProp] of SESSION_HEADER_TO_TRACING_PROP) {
    const headerValue = tracing[tracingProp];
    if (headerValue) {
      headers[headerName] = headerValue;
    }
  }

  return headers;
};
