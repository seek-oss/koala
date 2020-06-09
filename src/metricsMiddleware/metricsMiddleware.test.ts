import { StatsD } from 'hot-shots';
import Koa from 'koa';

import { create } from './metricsMiddleware';

describe('metricsMiddleware', () => {
  const makeCtx = (fields: Record<string, unknown> = {}): Koa.Context =>
    (({
      state: {},
      method: 'GET',
      ...fields,
    } as unknown) as Koa.Context);

  it('should record metrics for a successful request', async () => {
    const mockTiming = jest.fn();
    const mockMetricsClient = ({
      timing: mockTiming,
    } as unknown) as StatsD;

    const tagsForContext = () => ({});

    const mockCtx: Koa.Context = makeCtx({ method: 'POST' });
    const mockNext = jest.fn().mockImplementation(() => {
      mockCtx.status = 201;
    });

    const metricsMiddleware = create(mockMetricsClient, tagsForContext);
    await metricsMiddleware(mockCtx, mockNext);

    expect(mockTiming).toHaveBeenCalledTimes(1);

    const [name, latency, sample, tags] = mockTiming.mock.calls[0] as unknown[];
    expect(name).toBe('request');
    expect(latency).toBeGreaterThanOrEqual(0);
    expect(sample).toBeUndefined();
    expect(tags).toEqual({
      http_status: '201',
      http_status_family: '2xx',
      http_method: 'post',
    });
  });

  it('should record metrics for a failed request', async () => {
    const mockTiming = jest.fn();
    const mockMetricsClient = ({
      timing: mockTiming,
    } as unknown) as StatsD;

    const tagsForContext = (ctx: Koa.Context) => ({
      test_original_status: ctx.status,
    });

    const mockCtx: Koa.Context = makeCtx();
    const mockNext = jest.fn().mockImplementation(() => {
      mockCtx.status = 302;
      throw new Error('Internal failure!');
    });

    const metricsMiddleware = create(mockMetricsClient, tagsForContext);
    await expect(metricsMiddleware(mockCtx, mockNext)).rejects.toBeDefined();

    expect(mockTiming).toHaveBeenCalledTimes(1);

    const [name, latency, sample, tags] = mockTiming.mock.calls[0] as unknown[];
    expect(name).toBe('request');
    expect(latency).toBeGreaterThanOrEqual(0);
    expect(sample).toBeUndefined();
    expect(tags).toEqual({
      http_status: '500',
      http_status_family: '5xx',
      http_method: 'get',
      test_original_status: 302,
    });
  });

  it('should skip recording if the handler requests it', async () => {
    const mockTiming = jest.fn();
    const mockMetricsClient = ({
      timing: mockTiming,
    } as unknown) as StatsD;

    const tagsForContext = () => ({});

    const mockCtx: Koa.Context = makeCtx();
    const mockNext = jest.fn().mockImplementation(() => {
      mockCtx.state.skipRequestLogging = true;
    });

    const metricsMiddleware = create(mockMetricsClient, tagsForContext);
    await metricsMiddleware(mockCtx, mockNext);

    expect(mockTiming).not.toHaveBeenCalled();
  });
});
