import { describe, expect, it } from 'vitest';

import { TracingHeaders } from './index.js';

describe('index', () => {
  it('should export `TracingHeaders`', () => {
    expect(TracingHeaders).toBeDefined();
  });
});
