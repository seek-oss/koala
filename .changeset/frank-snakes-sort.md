---
'seek-koala': major
---

Update npm package build outputs

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
