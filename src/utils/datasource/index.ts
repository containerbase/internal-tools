import { getDatasources } from 'renovate/dist/datasource';
import * as renovate from './renovate-slim';

export function register(): void {
  const ds = getDatasources();
  ds.set(renovate.id, Promise.resolve(renovate));
}
