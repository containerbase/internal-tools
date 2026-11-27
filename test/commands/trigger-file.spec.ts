import * as _core from '@actions/core';
import nock from 'nock';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { run, update } from '../../src/commands/trigger-file';
import * as _utils from '../../src/util';

vi.mock('../../src/util');

const core = vi.mocked(_core);
const utils = vi.mocked(_utils);

const header = [
  '#-------------------------',
  '# renovate rebuild trigger',
  '#-------------------------',
  '',
  '# makes lint happy',
  'FROM scratch',
];

/** Joins lines to a file content with a trailing newline. */
function file(...lines: string[]): string {
  return lines.join('\n') + '\n';
}

const pythonCycles = [
  { cycle: '3.14', eol: '2030-10-31', latest: '3.14.1' },
  { cycle: '3.13', eol: '2029-10-31', latest: '3.13.9' },
  { cycle: '3.12', eol: '2028-10-31', latest: '3.12.12' },
  { cycle: '3.11', eol: '2027-10-31', latest: '3.11.14' },
  { cycle: '3.10', eol: '2026-10-31', latest: '3.10.19' },
  { cycle: '3.9', eol: '2025-10-31', latest: '3.9.25' },
];

describe('commands/trigger-file', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-27T12:00:00Z'));
    core.getInput.mockImplementation((k) => (k === 'config' ? 'builder.json' : ''));
    utils.isDryRun.mockReturnValue(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    nock.cleanAll();
  });

  it('updates the python trigger file', async () => {
    utils.readJson.mockResolvedValueOnce({
      image: 'python',
      startVersion: '3.9.0',
      eol: { product: 'python', stream: 'minor' },
    });
    utils.readFile.mockResolvedValueOnce(
      file(
        ...header,
        '',
        '# EOL 2025-10',
        '# renovate: datasource=docker depName=python versioning=docker',
        'ENV PYTHON_VERSION=3.9.25',
        '',
        '# EOL: 2026-10',
        '# renovate: datasource=docker depName=python versioning=docker',
        'ENV PYTHON_VERSION=3.11.10',
      ),
    );
    nock('https://endoflife.date').get('/api/python.json').reply(200, pythonCycles);

    await run();

    expect(core.setFailed).not.toHaveBeenCalled();
    expect(utils.writeFile).toHaveBeenCalledExactlyOnceWith(
      'renovate.Dockerfile',
      file(
        ...header,
        '',
        '# EOL: 2027-10',
        '# renovate: datasource=docker depName=python versioning=docker',
        'ENV PYTHON_VERSION=3.11.10',
        '',
        '# EOL: 2028-10',
        '# renovate: datasource=docker depName=python versioning=docker',
        'ENV PYTHON_VERSION=3.12.12',
        '',
        '# EOL: 2029-10',
        '# renovate: datasource=docker depName=python versioning=docker',
        'ENV PYTHON_VERSION=3.13.9',
        '',
        '# EOL: 2030-10',
        '# renovate: datasource=docker depName=python versioning=docker',
        'ENV PYTHON_VERSION=3.14.1',
      ),
    );
    expect(core.setOutput).toHaveBeenCalledWith('changed', true);
    expect(core.setOutput).toHaveBeenCalledWith(
      'summary',
      [
        '- Dropped `3.9` (EOL 2025-10-31)',
        '- Added `3.12` (3.12.12)',
        '- Added `3.13` (3.13.9)',
        '- Added `3.14` (3.14.1)',
      ].join('\n'),
    );
  });

  it('handles node RUN lines and duplicates', async () => {
    utils.readJson.mockResolvedValueOnce({
      eol: { product: 'nodejs', stream: 'major', file: 'node.Dockerfile' },
    });
    utils.readFile.mockResolvedValueOnce(
      file(
        ...header,
        '',
        '# renovate: datasource=node-version depName=node',
        'RUN install-tool node 20.19.0',
        '',
        '# renovate: datasource=node-version depName=node',
        'RUN install-tool node 20.19.1',
        '',
        '# EOL: TBD',
        '# renovate: datasource=node-version depName=node',
        'RUN install-tool node 22.23.5',
      ),
    );
    nock('https://endoflife.date')
      .get('/api/nodejs.json')
      .reply(200, [
        { cycle: '24', eol: '2028-04-30', latest: '24.2.0' },
        { cycle: '22', eol: '2027-04-30', latest: '22.23.5' },
        { cycle: '20', eol: '2026-04-30', latest: '20.19.1' },
      ]);

    await run();

    expect(utils.writeFile).toHaveBeenCalledExactlyOnceWith(
      'node.Dockerfile',
      file(
        ...header,
        '',
        '# EOL: 2027-04',
        '# renovate: datasource=node-version depName=node',
        'RUN install-tool node 22.23.5',
        '',
        '# EOL: 2028-04',
        '# renovate: datasource=node-version depName=node',
        'RUN install-tool node 24.2.0',
      ),
    );
    expect(core.setOutput).toHaveBeenCalledWith(
      'summary',
      ['- Dropped `20` (EOL 2026-04-30)', '- Removed duplicate `20`', '- Added `24` (24.2.0)'].join(
        '\n',
      ),
    );
  });

  it('handles 4-part erlang versions without EOL comments', async () => {
    utils.readJson.mockResolvedValueOnce({ eol: { product: 'erlang', stream: 'major' } });
    utils.readFile.mockResolvedValueOnce(
      file(
        ...header,
        '',
        '# renovate: datasource=docker depName=erlang',
        'ENV ERLANG_VERSION=27.3.4.20',
      ),
    );
    nock('https://endoflife.date')
      .get('/api/erlang.json')
      .reply(200, [
        { cycle: '28', eol: false, latest: '28.1.2.3' },
        { cycle: '27', eol: false, latest: '27.3.4.20' },
      ]);

    await run();

    expect(utils.writeFile).toHaveBeenCalledExactlyOnceWith(
      'renovate.Dockerfile',
      file(
        ...header,
        '',
        '# EOL: TBD',
        '# renovate: datasource=docker depName=erlang',
        'ENV ERLANG_VERSION=27.3.4.20',
        '',
        '# EOL: TBD',
        '# renovate: datasource=docker depName=erlang',
        'ENV ERLANG_VERSION=28.1.2.3',
      ),
    );
  });

  it('uses the last dropped block as template', async () => {
    utils.readJson.mockResolvedValueOnce({ eol: { product: 'go', stream: 'minor' } });
    utils.readFile.mockResolvedValueOnce(
      file(
        '# renovate: datasource=docker depName=golang',
        'ENV GOLANG_VERSION=1.26.1',
        '',
        '# renovate: datasource=docker depName=golang',
        'ENV GOLANG_VERSION=1.20.1',
      ),
    );
    nock('https://endoflife.date')
      .get('/api/go.json')
      .reply(200, [
        { cycle: '1.27', eol: false, latest: '1.27.4' },
        { cycle: '1.26', eol: '2025-01-01', latest: '1.26.1' },
        { cycle: '1.20', eol: '2024-01-01', latest: '1.20.14' },
        { cycle: '1', eol: false, latest: '1.0.0' },
      ]);

    await run();

    expect(utils.writeFile).toHaveBeenCalledExactlyOnceWith(
      'renovate.Dockerfile',
      file(
        '# EOL: TBD',
        '# renovate: datasource=docker depName=golang',
        'ENV GOLANG_VERSION=1.27.4',
      ),
    );
  });

  it('keeps unknown streams and extra comment lines', () => {
    const result = update(
      file(
        '# EOL: TBD (expected)',
        '# a note',
        '# renovate: datasource=docker depName=ruby',
        'ENV RUBY_VERSION=3.4.1',
      ),
      [{ cycle: '3.5', eol: false, latest: '3.5.0' }],
      { product: 'ruby', stream: 'minor' },
      '2026-11-27',
    );

    expect(result.content).toBe(
      file(
        '# EOL: TBD (expected)',
        '# a note',
        '# renovate: datasource=docker depName=ruby',
        'ENV RUBY_VERSION=3.4.1',
        '',
        '# EOL: TBD',
        '# renovate: datasource=docker depName=ruby',
        'ENV RUBY_VERSION=3.5.0',
      ),
    );
  });

  it('only normalizes the EOL comments', () => {
    const result = update(
      file('# EOL: 2027', '# renovate: datasource=docker depName=php', 'ENV PHP_VERSION=8.4.1'),
      [{ cycle: '8.4', eol: '2028-12-31', latest: '8.4.1' }],
      { product: 'php', stream: 'minor' },
      '2026-11-27',
    );

    expect(result).toEqual({
      content: file(
        '# EOL: 2028-12',
        '# renovate: datasource=docker depName=php',
        'ENV PHP_VERSION=8.4.1',
      ),
      summary: '- Normalized the EOL comments',
    });
  });

  it('adds nothing without any block', () => {
    const result = update(
      file(...header),
      [{ cycle: '8.4', eol: false, latest: '8.4.1' }],
      { product: 'php', stream: 'minor' },
      '2026-11-27',
    );

    expect(result).toEqual({ content: file(...header), summary: '' });
  });

  it('rejects unsupported blocks', () => {
    expect(() =>
      update(
        file('# renovate: datasource=docker depName=php', 'FROM php'),
        [],
        { product: 'php', stream: 'minor' },
        '2026-11-27',
      ),
    ).toThrow('Unsupported block');
  });

  it('keeps unknown streams without EOL comment', () => {
    const content = file(
      '# renovate: datasource=docker depName=ruby',
      'ENV RUBY_VERSION=3.4.1',
      '',
      '# renovate: datasource=docker depName=ruby',
      'ENV RUBY_VERSION=3.10.0',
      '',
      '# renovate: datasource=docker depName=ruby',
      'ENV RUBY_VERSION=3.9.0',
    );

    expect(update(content, [], { product: 'ruby', stream: 'minor' }, '2026-11-27')).toEqual({
      content: file(
        '# renovate: datasource=docker depName=ruby',
        'ENV RUBY_VERSION=3.4.1',
        '',
        '# renovate: datasource=docker depName=ruby',
        'ENV RUBY_VERSION=3.9.0',
        '',
        '# renovate: datasource=docker depName=ruby',
        'ENV RUBY_VERSION=3.10.0',
      ),
      summary: '- Normalized the EOL comments',
    });
  });

  it('does nothing without eol config', async () => {
    core.getInput.mockReturnValue('');
    utils.readJson.mockResolvedValueOnce({ image: 'python', startVersion: '3.9.0' });

    await run();

    expect(utils.readFile).not.toHaveBeenCalled();
    expect(utils.writeFile).not.toHaveBeenCalled();
    expect(core.setOutput).toHaveBeenCalledWith('changed', false);
    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it('does not write in dry-run mode', async () => {
    utils.isDryRun.mockReturnValue(true);
    utils.readJson.mockResolvedValueOnce({ eol: { product: 'php', stream: 'minor' } });
    utils.readFile.mockResolvedValueOnce(
      file('# renovate: datasource=docker depName=php', 'ENV PHP_VERSION=8.3.1'),
    );
    nock('https://endoflife.date')
      .get('/api/php.json')
      .reply(200, [
        { cycle: '8.4', eol: false, latest: '8.4.1' },
        { cycle: '8.3', eol: false, latest: '8.3.1' },
      ]);

    await run();

    expect(utils.writeFile).not.toHaveBeenCalled();
    expect(core.setOutput).toHaveBeenCalledWith('changed', true);
  });

  it('does not write an unchanged file', async () => {
    utils.readJson.mockResolvedValueOnce({ eol: { product: 'php', stream: 'minor' } });
    utils.readFile.mockResolvedValueOnce(
      file('# EOL: TBD', '# renovate: datasource=docker depName=php', 'ENV PHP_VERSION=8.3.1'),
    );
    nock('https://endoflife.date')
      .get('/api/php.json')
      .reply(200, [{ cycle: '8.3', eol: false, latest: '8.3.1' }]);

    await run();

    expect(utils.writeFile).not.toHaveBeenCalled();
    expect(core.setOutput).toHaveBeenCalledWith('changed', false);
  });

  it('fails on http errors', async () => {
    utils.readJson.mockResolvedValueOnce({ eol: { product: 'python', stream: 'minor' } });
    nock('https://endoflife.date').get('/api/python.json').reply(404);

    await run();

    expect(utils.writeFile).not.toHaveBeenCalled();
    expect(core.setFailed).toHaveBeenCalledOnce();
  });
});
