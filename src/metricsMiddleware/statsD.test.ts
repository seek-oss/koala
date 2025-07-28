import type { StatsD as HotShotsStatsD } from 'hot-shots';

import type { StatsD as VendoredStatsD } from './statsD.js';

describe('statsD', () => {
  it('accepts a hot-shots interface', () => {
    const hotShots = true as unknown as HotShotsStatsD;

    const vendored: VendoredStatsD = hotShots;

    expect(vendored).toBe(true);
  });
});
