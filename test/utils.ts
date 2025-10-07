/**
 * Simply wrapper to create partial mocks.
 * @param obj Object to cast to final type
 */
export function partial<T>(obj?: Partial<T>): T {
  return (obj ?? {}) as T;
}
