import { getVersionings } from 'renovate/dist/versioning';
import log from '../logger';
import * as node from './node';

export function register(): void {
  log('register versionings');
  const ds = getVersionings();
  ds.set(node.id, node.api);
}
