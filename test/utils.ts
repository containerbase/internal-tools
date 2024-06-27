import { MaybeMockedDeep } from '@vitest/spy';
import { vi } from 'vitest';

/**
 * Simple wrapper for getting mocked version of a module
 * @param module module which is mocked by `vi.mock`
 */
export function mocked<T>(module: T): MaybeMockedDeep<T> {
  return vi.mocked(module, true);
}

/**
 * Simply wrapper to create partial mocks.
 * @param obj Object to cast to final type
 */
export function partial<T>(obj?: Partial<T>): T {
  return (obj ?? {}) as T;
}
