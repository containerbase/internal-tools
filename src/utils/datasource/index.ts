import log from '../logger';
import { getDatasources } from 'renovate/dist/modules/datasource';

export function register(): void {
  log('register datasources');
  getDatasources();
}
