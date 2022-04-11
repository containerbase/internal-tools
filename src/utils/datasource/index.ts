import { getDatasources } from 'renovate/dist/modules/datasource';
import log from '../logger';

export function register(): void {
  log('register datasources');
  getDatasources();
}
