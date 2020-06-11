# 🐨 Version Middleware 🐨

## Introduction

This add-on wraps an asynchronously-initialised middleware to allow it to be synchronously attached to a Koa application.
This is useful if you want to keep the initialisation of your Koa application synchronous for simplicity and interoperability with tooling like [Koa Cluster],
but you need to perform asynchronous work like [GraphQL schema introspection] in order to build one of the middlewares in your chain.

[koa cluster]: https://github.com/koajs/cluster
[graphql schema introspection]: https://graphql.org/learn/introspection/

## Usage

```typescript
import { AsyncMiddleware } from 'seek-koala';

const initGraphMiddleware: = async () => {
  const schema = await introspectSchema();

  return new GraphServer(schema).getMiddleware();
};

const graphMiddleware = AsyncMiddleware.lazyLoad(initGraphMiddleware);

app.use(graphMiddleware);
```
