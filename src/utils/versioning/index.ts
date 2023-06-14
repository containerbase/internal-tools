import log from '../logger';
import * as ubuntu from './ubuntu';
import { getVersionings } from 'renovate/dist/modules/versioning';

export function register(): void {
  log('register versionings');
  const ds = getVersionings();
  ds.set(ubuntu.id, ubuntu.api);
}
