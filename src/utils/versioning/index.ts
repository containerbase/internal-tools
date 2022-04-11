import { getVersionings } from 'renovate/dist/modules/versioning';
import log from '../logger';
import * as ubuntu from './ubuntu';

export function register(): void {
  log('register versionings');
  const ds = getVersionings();
  ds.set(ubuntu.id, ubuntu.api);
}
