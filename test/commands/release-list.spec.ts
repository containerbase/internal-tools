import fs from 'node:fs/promises';
import * as _core from '@actions/core';
import { describe, expect, it, vi } from 'vitest';
import { run } from '../../src/commands/release-list';
import * as _utils from '../../src/util';
import * as _github from '../../src/utils/github';

vi.mock('node:fs/promises');
vi.mock('../../src/util');
vi.mock('../../src/utils/github');

const core = vi.mocked(_core);
const utils = vi.mocked(_utils);
const github = vi.mocked(_github);

describe('commands/release-list', () => {
  it('works', async () => {
    utils.getWorkspace.mockReturnValue('.');

    github.getReleases.mockResolvedValue([
      {
        id: 1,
        tag_name: 'v1.0.0',
        upload_url: 'url',
        published_at: '2024-01-01T00:00:00Z',
        assets: [],
      },
    ]);

    await expect(run()).resolves.not.toThrow();
    expect(core.setFailed).not.toHaveBeenCalled();
    expect(fs.writeFile).toHaveBeenCalledExactlyOnceWith(
      './_site/releases.json',
      JSON.stringify({
        releases: [
          {
            version: 'v1.0.0',
            releaseTimestamp: '2024-01-01T00:00:00Z',
          },
        ],
      }),
    );
  });

  it('caches errors', async () => {
    utils.getWorkspace.mockReturnValue('.');

    github.getReleases.mockRejectedValue(new Error('Failed to fetch releases'));

    await expect(run()).resolves.not.toThrow();
    expect(core.setFailed).toHaveBeenCalled();
  });
});
