import Koa from 'koa';

import { middleware } from './secureHeaders';

describe('secureHeaders', () => {
  it('should set headers unconditionally', async () => {
    const mockCtx = {
      set: jest.fn(),
    } as unknown as Koa.Context;
    const mockNext = jest.fn();

    await middleware(mockCtx, mockNext);

    expect(mockCtx.set).toHaveBeenCalledWith(
      'Strict-Transport-Security',
      expect.anything(),
    );
    expect(mockCtx.set).toHaveBeenCalledWith(
      'Content-Security-Policy',
      expect.anything(),
    );

    expect(mockNext).toHaveBeenCalled();
  });
});
