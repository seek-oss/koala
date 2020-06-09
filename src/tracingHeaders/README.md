# 🐨 Tracing Headers 🐨

## Introduction

This add-on deals with [RFC002 request tracing](https://github.com/SEEK-Jobs/rfc/blob/master/RFC002-RequestIds.md), session and `User-Agent` headers:

- `tracingFromContext` extracts tracing headers from an incoming request.

- `outgoingHeaders` builds tracing headers for an outgoing request.

## Usage

```typescript
import { TracingHeaders } from '@seek/koala';

// Get our incoming tracing information
const tracing = TracingHeaders.tracingFromContext(ctx);

// Pass an appID as a basis for our `User-Agent`
const appID = {
  name: 'ca-example-service',
  version: '1234',
};

// Generate headers for an outgoing request
const headers = TracingHeaders.outgoingHeaders(appID, tracing);
const client = axios.create({ headers });
```

## Session Headers

While there is no RFC for session headers there are three defacto session headers recognised:

- `X-EC-SEEK-SessionId` reflects the value of the candidate’s `JobseekerSessionId` cookie.

- `X-EC-SEEK-VisitorId` reflects the value of the candidate’s `JobseekerVisitorId` cookie.

- `X-Session-Id` is an ad-hoc header that is defined contextually by the system using it.

Unlike `X-Request-Id`, session headers are not automatically generated if they're absent in the incoming request.
