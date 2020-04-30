import { getDatasources } from 'renovate/dist/datasource';
import * as renovate from './renovate-slim';
import log from '../logger';

export function register(): void {
  log('register datasources');
  const ds = getDatasources();
  ds.set(renovate.id, Promise.resolve(renovate));
}
