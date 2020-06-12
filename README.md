# 🐨 Koa Loose Add-ons

![GitHub Release](https://github.com/seek-oss/koala/workflows/Release/badge.svg?branch=master)
![GitHub Validate](https://github.com/seek-oss/koala/workflows/Validate/badge.svg?branch=master)
[![Node.js version](https://img.shields.io/badge/node-%3E%3D%2010-brightgreen)](https://nodejs.org/en/)
[![npm package](https://img.shields.io/npm/v/seek-koala)](https://www.npmjs.com/package/seek-koala)
[![Powered by skuba](https://img.shields.io/badge/🤿%20skuba-powered-009DC4)](https://github.com/seek-oss/skuba)

## Introduction

Koala is a collection of Koa add-ons intended to make it easy to follow common SEEK conventions around tracing, logging and metrics.
Refer to the [Koala manifesto](CONTRIBUTING.md) for philosophy behind Koala.

```shell
yarn add seek-koala
```

## Included Add-Ons

- **[AsyncMiddleware](./src/asyncMiddleware/README.md)** facilitates lazy loading of an asynchronously-initialised middleware.

- **[MetricsMiddleware](./src/metricsMiddleware/README.md)** uses [hot-shots](https://github.com/brightcove/hot-shots) to record Datadog metrics about requests and their response codes.

- **[RequestLogging](./src/requestLogging/README.md)** facilitates logging information about requests and responses.

- **[SecureHeaders](./src/secureHeaders/README.md)** attaches response headers that opt-in to stricter browser security policies.

- **[TracingHeaders](./src/tracingHeaders/README.md)** deals with [RFC002 request tracing](https://github.com/SEEK-Jobs/rfc/blob/master/RFC002-RequestIds.md) and `User-Agent` headers.

- **[VersionMiddleware](./src/versionMiddleware/README.md)** attaches app version information to outgoing responses.
