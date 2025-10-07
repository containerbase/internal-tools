import * as _core from '@actions/core';
import * as matchers from 'jest-extended';
import * as nock from 'nock';
import { afterAll, beforeAll, expect, vi } from 'vitest';

expect.extend(matchers);

vi.mock('@actions/core');
vi.mock('@actions/github');
vi.mock('../src/utils/logger');

const core = vi.mocked(_core);

beforeAll(() => {
  nock.disableNetConnect();
  core.getInput.mockReturnValue('');
});

afterAll(() => {
  nock.restore();
});
