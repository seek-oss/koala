type Tags = { [key: string]: string } | string[];

/**
 * Vendored from `hot-shots.StatsD` so that TypeScript consumers are not forced
 * to install `hot-shots` when they are not using MetricsMiddleware.
 */
export interface StatsD {
  timing(stat: string | string[], value: number, tags?: Tags): void;
}
