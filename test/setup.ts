// Node v16 is missing structuredClone, so we polyfill it here.
import 'core-js/actual/structured-clone';

import * as _core from '@actions/core';
import * as nock from 'nock';
import { mocked } from './utils';

jest.mock('@actions/core');
jest.mock('@actions/github');
jest.mock('../src/utils/logger');

const core = mocked(_core);

beforeAll(() => {
  nock.disableNetConnect();
  core.getInput.mockReturnValue('');
});

afterAll(() => {
  jest.clearAllMocks();
  nock.restore();
});
