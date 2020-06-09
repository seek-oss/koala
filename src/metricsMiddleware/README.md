# 🐨 Metrics Middleware 🐨

## Introduction

This add-on uses [hot-shots](https://github.com/brightcove/hot-shots) to record Datadog metrics about requests and their response codes.
It will record a histogram metric called `request` with `http_status` and `http_status_family` tags.
Additional tags can be specified by the application on a per-request basis.

This middleware is not as reliable as [AWS's ALB CloudWatch metrics](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-cloudwatch-metrics.html).
Requests can fail before they reach Koa, especially if there is a problem with the deployment, container, etc.
Alerts on application-wide metrics such as `5xx` rates and latency should either rely on [Gantry](https://github.com/SEEK-Jobs/gantry)'s PagerDuty integration or monitors based on [Datadog's AWS ELB integration](https://docs.datadoghq.com/integrations/amazon_elb/).

## Attaching Additional Tags

Before recording a timing metric the `tagsForContext` callback will be called with the Koa context.
The callback is expected to return a object mapping Datadog tags to their values.
Typically at least the name of the handler or route should be returned.

Be careful to only return tags with a small number of possible values.
Every metric value creates a [Datadog custom metric](https://docs.datadoghq.com/developers/metrics/custom_metrics/#how-is-a-custom-metric-defined) which is a limited resource.
For example, instead of returning `path: "/users/33858"` something like `route: "user_by_id"` should be used instead.

Because Koa has no built-in routing support the method of getting the route name will be app-specific.

## Usage

```typescript
import { StatsD } from 'hot-shots';
import { MetricsMiddleware } from 'seek-koala';

const metricsClient = new StatsD({
  prefix: 'ca-example-service',
});

const tagsForContext = (ctx: Koa.Context) => ({
  // This assumes `koa-router` without nesting routing
  route: ctx._matchedRouteName,
});

const metricsMiddleware = MetricsMiddleware.create(
  metricsClient,
  tagsForContext,
);
app.use(metricsMiddleware);
```
