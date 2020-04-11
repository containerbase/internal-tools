import * as _core from '@actions/core';
import nock from 'nock';
import { getName, mocked } from '../../utils';
import * as _utils from '../../../src/util';
import { run } from '../../../src/commands/github/cleanup';

jest.mock('../../../src/util');
jest.unmock('@actions/github');

const core = mocked(_core);
const utils = mocked(_utils);

const apiUrl = 'https://api.github.com';
const repo = 'org/repo';
const base = `/repos/${repo}`;
const actions = `${base}/actions`;

const defaultEnv = {
  GITHUB_REPOSITORY: repo,
  GITHUB_REF: 'refs/heads/test/branch',
  GITHUB_RUN_ID: '1234',
  GITHUB_EVENT_NAME: 'push',
};

type DefaultEnv = typeof defaultEnv;

describe(getName(__filename), () => {
  let scope: nock.Scope;
  let env: Record<keyof DefaultEnv, string> & Record<string, string>;
  beforeEach(() => {
    jest.clearAllMocks();
    nock.cleanAll();
    core.getInput.mockReturnValueOnce('token');

    utils.getEnv.mockImplementation((r) => env[r]);

    env = { ...defaultEnv };

    scope = nock(apiUrl)
      .get(`${actions}/runs/1234`)
      .reply(200, { workflow_url: `${actions}/workflows/53718`, run_number: 5 })
      .get(`${actions}/workflows/53718/runs?branch=test%2Fbranch`)
      .reply(200, {
        total_count: 500,
        workflow_runs: [
          { id: 1234 },
          { id: 1235, status: 'completed' },
          { id: 1236, event: 'pull_request', status: 'queued' },
          { id: 4321, event: 'push', status: 'queued' },
          { id: 4322, event: 'push', status: 'queued', run_number: 6 },
        ],
      });
  });

  it('works', async () => {
    const scope2 = nock(apiUrl).post(`${actions}/runs/4321/cancel`).reply(200);
    await run();
    expect(scope.isDone()).toBe(true);
    expect(scope2.isDone()).toBe(true);
  });

  it('works (dry-run)', async () => {
    utils.isDryRun.mockReturnValueOnce(true);
    await run();
    expect(scope.isDone()).toBe(true);
  });

  it('throws  (repo)', async () => {
    expect.assertions(1);
    env.GITHUB_REPOSITORY = '';

    try {
      await run();
    } catch (e) {
      expect(e.message).toEqual('Missing missing repo');
    }
  });

  it('throws  (event)', async () => {
    expect.assertions(1);
    delete env.GITHUB_EVENT_NAME;

    try {
      await run();
    } catch (e) {
      expect(e.message).toEqual('Missing event');
    }
  });

  it('throws  (run_id)', async () => {
    expect.assertions(1);
    delete env.GITHUB_RUN_ID;

    try {
      await run();
    } catch (e) {
      expect(e.message).toEqual('Missing workflow run id');
    }
  });

  it('throws  (branch)', async () => {
    expect.assertions(1);
    env.GITHUB_REF = '';

    try {
      await run();
    } catch (e) {
      expect(e.message).toEqual('Missing branch');
    }
  });

  it('throws  (workflow_id)', async () => {
    expect.assertions(2);

    nock.cleanAll();
    const scope = nock(apiUrl).get(`${actions}/runs/1234`).reply(200, {});

    try {
      await run();
    } catch (e) {
      expect(e.message).toEqual('Missing workflow id');
    }

    expect(scope.isDone()).toBe(true);
  });
});
