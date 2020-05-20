import { getDatasources } from 'renovate/dist/datasource';
import log from '../logger';
import * as renovate from './renovate-slim';

export function register(): void {
  log('register datasources');
  const ds = getDatasources();
  ds.set(renovate.id, Promise.resolve(renovate));
}
