# 🐨 Secure Headers 🐨

## Introduction

This add-on attaches headers that opt-in to stricter browser security policies.
These policies are very restrictive and some are scoped to the entire domain.
As such, it's important that this middleware is only used under these circumstances:

1. The app's domain does not mix HTTP and HTTPS.

2. The response is an API response, i.e. it is not being directly rendered by the browser.

3. The responses have an accurate `Content-Type` header.

If the above conditions are not met then the app should send customised security headers tailored to its use case.
[koa-helmet](https://github.com/venables/koa-helmet) provides a set of fine-grained middleware useful for constructing custom security headers.

## Usage

```typescript
import { SecureHeaders } from 'seek-koala';

// Opt-in to strict browser security
app.use(SecureHeaders.middleware);
```
