import { getVersionings } from 'renovate/dist/versioning';
import * as node from './node';
import log from '../logger';

export function register(): void {
  log('register versionings');
  const ds = getVersionings();
  ds.set(node.id, node.api);
}
