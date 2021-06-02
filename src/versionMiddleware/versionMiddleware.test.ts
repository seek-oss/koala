import Koa from 'koa';

import { create } from './versionMiddleware';

describe('versionMiddleware', () => {
  it('should set headers with version when present', async () => {
    const mockCtx = {
      set: jest.fn(),
    } as unknown as Koa.Context;
    const mockNext = jest.fn();

    const appID = {
      name: 'seek-example-app',
      version: '1234',
    };

    const versionMiddleware = create(appID);
    await versionMiddleware(mockCtx, mockNext);

    expect(mockCtx.set).toHaveBeenCalledWith('Server', 'seek-example-app/1234');
    expect(mockCtx.set).toHaveBeenCalledWith('X-Api-Version', '1234');

    expect(mockNext).toHaveBeenCalled();
  });

  it('should set headers without a version', async () => {
    const mockCtx = {
      set: jest.fn(),
    } as unknown as Koa.Context;
    const mockNext = jest.fn();

    const appID = {
      name: 'seek-example-app',
    };

    const versionMiddleware = create(appID);
    await versionMiddleware(mockCtx, mockNext);

    expect(mockCtx.set).toHaveBeenCalledWith('Server', 'seek-example-app');

    expect(mockNext).toHaveBeenCalled();
  });
});
