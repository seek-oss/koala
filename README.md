# 🐨 Koa Loose Add-ons 🐨

[![Build status](https://badge.buildkite.com/ad7ae4309109fe48b7b4ff411e6741efc1b01afba529adaedc.svg?branch=master)](https://buildkite.com/seek/koala)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square)](https://github.com/semantic-release/semantic-release)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?style=flat-square)](http://commitizen.github.io/cz-cli/)

## Introduction

Koala is a collection of add-ons intended to make it easy to follow common SEEK conventions around tracing, logging and metrics.
Refer to the [Koala manifesto](CONTRIBUTING.md) for philosophy behind Koala.

## Included Add-Ons

1. **[MetricsMiddleware](./src/metricsMiddleware/README.md)** uses [hot-shots](https://github.com/brightcove/hot-shots) to record Datadog metrics about requests and their response codes.

2. **[RequestLogging](./src/requestLogging/README.md)** facilitates logging information about requests and responses.

3. **[SecureHeaders](./src/secureHeaders/README.md)** attaches response headers that opt-in to stricter browser security policies.

4. **[TracingHeaders](./src/tracingHeaders/README.md)** deals with [RFC002 request tracing](https://github.com/SEEK-Jobs/rfc/blob/master/RFC002-RequestIds.md) and `User-Agent` headers.

5. **[VersionMiddleware](./src/versionMiddleware/README.md)** attaches app version information to outgoing responses.

## Related Modules

These modules are useful for building SEEK services in Node.js without being directly bound to Koa:

- **[@seek/node-datadog-custom-metrics](https://github.com/SEEK-Jobs/node-datadog-custom-metrics)** contains helpers for sending Datadog custom metrics.

- **[@seek/node-s2sauth-issuer](https://github.com/SEEK-Jobs/node-s2sauth-issuer)** issues [s2sauth](https://github.com/SEEK-Jobs/s2sauth) tokens from a private key.
