import os from 'os';
import { init as cacheInit } from 'renovate/dist/util/cache/global/file';
import * as renovate from './datasource';
import log from './logger';
import * as v from './versioning';

// istanbul ignore if
if (!global.renovateCache) {
  cacheInit(os.tmpdir());
}

export function register(): void {
  log('register renovate extensions');
  renovate.register();
  v.register();
}
