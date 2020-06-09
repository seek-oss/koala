# 🐨 Version Middleware 🐨

## Introduction

This add-on attaches app version information to outgoing responses.
This is useful for debugging live services, especially during a blue/green deployment where different responses can come from different deployed versions.

It attaches two headers:

- `Server` is set to `${appID.name}/${appID.version}` e.g. `seek-example-service/1234`.
  This is the standard HTTP header for indicating the serving software.
  It has the disadvantage of being replaced by other servers on the response path such as Nginx.

- `X-API-Version` is set to `${appID.version}` e.g. `1234`.
  This is a convention that originated from the Candidate team.
  Due to being non-standard this is typically preserved along the response path.

## Usage

```typescript
import { VersionMiddleware } from 'seek-koala';

// Pass an appID with our name and version
const appID = {
  name: 'ca-example-service',
  version: '1234',
};

// Attach version headers to all outgoing responses
const versionMiddleware = VersionMiddleware.create(appID);
app.use(versionMiddleware);
```
