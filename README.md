# 🐨 Koa Loose Add-ons

[![GitHub Release](https://github.com/seek-oss/koala/workflows/Release/badge.svg?branch=master)](https://github.com/seek-oss/koala/actions?query=workflow%3ARelease)
[![GitHub Validate](https://github.com/seek-oss/koala/workflows/Validate/badge.svg?branch=master)](https://github.com/seek-oss/koala/actions?query=workflow%3AValidate)
[![Node.js version](https://img.shields.io/badge/node-%3E%3D%2012.17-brightgreen)](https://nodejs.org/en/)
[![npm package](https://img.shields.io/npm/v/seek-koala)](https://www.npmjs.com/package/seek-koala)
[![Powered by skuba](https://img.shields.io/badge/🤿%20skuba-powered-009DC4)](https://github.com/seek-oss/skuba)

Koala is a collection of Koa add-ons that make it easy to follow SEEK conventions around tracing, logging and metrics.
Refer to the [Koala manifesto](#koala-manifesto) for philosophy behind Koala.

```shell
yarn add seek-koala
```

## Table of contents

- [Included add-ons](#included-add-ons)
- [Koala manifesto](#koala-manifesto)
- [Contributing](https://github.com/seek-oss/koala/blob/master/CONTRIBUTING.md)

## Included add-ons

- **[AsyncMiddleware](./src/asyncMiddleware/README.md)** facilitates lazy loading of an asynchronously-initialised middleware.

- **[ErrorMiddleware](./src/errorMiddleware/README.md)** catches errors from downstream middleware.

- **[MetricsMiddleware](./src/metricsMiddleware/README.md)** uses [hot-shots](https://github.com/brightcove/hot-shots) to record Datadog metrics about requests and their response codes.

- **[RequestLogging](./src/requestLogging/README.md)** facilitates logging information about requests and responses.

- **[SecureHeaders](./src/secureHeaders/README.md)** attaches response headers that opt-in to stricter browser security policies.

- **[TracingHeaders](./src/tracingHeaders/README.md)** deals with [RFC002 request tracing](https://github.com/SEEK-Jobs/rfc/blob/master/RFC002-RequestIds.md) and `User-Agent` headers.

- **[VersionMiddleware](./src/versionMiddleware/README.md)** attaches app version information to outgoing responses.

## Koala manifesto

- **Koala is not a framework**

  It empowers developers to quickly develop SEEK web services using [Koa](https://github.com/koajs/koa) using whatever structure they see fit.

- **Koala does not wrap other packages**

  The objects and types of JavaScript packages such as [Axios](https://github.com/axios/axios) and [hot-shots](https://github.com/brightcove/hot-shots) should be used directly.
  While Koala may provide constructors for objects from those packages,
  developers should always be able to "bring their own instance".

- **Koala does not contain policy**

  It does not enforce timeouts, set caching headers, expect certain error objects, etc.
  Whenever a default policy is unavoidable it should be called out in the documentation and made configurable.

- **Koala modules should be usable in isolation**

  An application should not have to "buy in" to all of Koala at once.
  Modules should not require special middleware to set up their state.

- **Koala is not innovative**

  It implements best practices from SEEK and follows [internal SEEK RFCs](https://github.com/SEEK-Jobs/rfc) and [s2sauth](https://github.com/SEEK-Jobs/s2sauth) where applicable.
  The modular, policy-free nature of Koala allows individual apps to opt-out of Koala's implementation for experimentation.

- **Koala is not a dumping ground**

  It strictly contains functionality related to developing Koa web services at SEEK.
  It should not include features only relevant to a single application or team.
