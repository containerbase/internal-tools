import * as renovate from './datasource';
import * as v from './versioning';
import log from './logger';

export function register(): void {
  log('register renovate extensions');
  renovate.register();
  v.register();
}
