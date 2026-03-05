# seek-koala

## 8.0.0

### Major Changes

- Update npm package build outputs ([#363](https://github.com/seek-oss/koala/pull/363))

  This release changes published build output paths. If you were previously importing from nested paths within the build output you may need to update imports to use the package entry point (for example, `seek-koala`).

  Please note that this usage is generally not recommended as it can lead to breakages when build outputs change.

  For example:

  ```diff
  -import { JsonResponse } from 'seek-koala/lib/errorMiddleware/errorMiddleware';
  +import { ErrorMiddleware } from 'seek-koala';

  -new JsonResponse('Bad input', {
  +new ErrorMiddleware.JsonResponse('Bad input', {
    message: 'Bad input',
    invalidFields: { '/path/to/field': 'Value out of range' },
  });
  ```

  ```diff
  -import { REQUEST_ID_HEADER } from 'seek-koala/lib/tracingHeaders/tracingHeaders';
  +import { TracingHeaders } from 'seek-koala';

  -const requestId = req.headers[REQUEST_ID_HEADER];
  +const requestId = req.headers[TracingHeaders.REQUEST_ID_HEADER];
  ```

- **BREAKING:** Bump minimum Node.js version from 14.17 to 22.14.0 ([#358](https://github.com/seek-oss/koala/pull/358))

### Patch Changes

- Publish with provenance ([#332](https://github.com/seek-oss/koala/pull/332))

- Extend hot-shots peer dependency range to include, 12.x, 13.x and 14.x ([#362](https://github.com/seek-oss/koala/pull/362))

## 7.1.1

### Patch Changes

- **RequestLogging:** Redact `X-Forwarded-Id-Token` header ([#322](https://github.com/seek-oss/koala/pull/322))

## 7.1.0

### Minor Changes

- **deps:** allow koa 3 peer dependency ([#312](https://github.com/seek-oss/koala/pull/312))

  koa 2 continues to be supported.

## 7.0.6

### Patch Changes

- Fix missing files in previous release ([#301](https://github.com/seek-oss/koala/pull/301))

## 7.0.5

### Patch Changes

- Support hot-shots 11.x ([#298](https://github.com/seek-oss/koala/pull/298))
