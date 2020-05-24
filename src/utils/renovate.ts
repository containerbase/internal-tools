import * as renovate from './datasource';
import log from './logger';
import * as v from './versioning';

export function register(): void {
  log('register renovate extensions');
  renovate.register();
  v.register();
}
