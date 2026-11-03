import { describe, expect, it } from 'vitest';

import { isPrerelease } from '../../src/utils/github';

describe('utils/github', () => {
  describe('isPrerelease', () => {
    it.each`
      versioning  | version                 | expected
      ${'node'}   | ${'25.2.1'}             | ${false}
      ${'node'}   | ${'24.11.1'}            | ${false}
      ${'node'}   | ${'27.0.0-alpha.0.0.0'} | ${true}
      ${'maven'}  | ${'3.9.11'}             | ${false}
      ${'maven'}  | ${'4.0.0-rc-7'}         | ${true}
      ${'maven'}  | ${'3.0'}                | ${false}
      ${'maven'}  | ${'4.0-alpha-1'}        | ${true}
      ${'semver'} | ${'v1.2.3-beta.1'}      | ${true}
    `('$versioning $version is $expected', ({ versioning, version, expected }) => {
      expect(isPrerelease({ versioning }, version)).toBe(expected);
    });
  });
});
