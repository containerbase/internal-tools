import { getDatasources } from 'renovate/dist/datasource';
import log from '../logger';

export function register(): void {
  log('register datasources');
  getDatasources();
}
