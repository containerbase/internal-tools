import { getVersionings } from 'renovate/dist/modules/versioning';
import log from '../logger';

export function register(): void {
  log('register versionings');
  getVersionings();
}
