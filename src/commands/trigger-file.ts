import { styleText } from 'node:util';

import { getInput, setFailed, setOutput } from '@actions/core';
import { isNonEmptyString, isObject } from '@sindresorhus/is';
import got from 'got';

import { isDryRun, readFile, readJson, writeFile } from '../util';
import log from '../utils/logger';
import type { ConfigFile } from '../utils/types';

type EolConfig = NonNullable<ConfigFile['eol']>;

/** A release cycle as returned by endoflife.date. */
interface Cycle {
  cycle: string;
  eol: string | boolean;
  latest: string;
}

/** A release block of the trigger file. */
interface Block {
  /** The major or major.minor stream of the version. */
  stream: string;
  eol?: string;
  /** Other comment lines of the block. */
  extra: string[];
  renovate: string;
  /** The `ENV` or `RUN` line up to the version. */
  prefix: string;
  version: string;
}

interface Result {
  content: string;
  /** Markdown bullet list of the changes. */
  summary: string;
}

const blockStartRe = /^# (?:EOL\b|renovate:)/;
const versionRe = /^[0-9A-Za-z][0-9A-Za-z.+_-]*$/;
const versionLineRe = /^(?<prefix>ENV \S+=|RUN install-tool \S+ )(?<version>\S+)$/;

/**
 * Returns the major or major.minor stream of a version.
 */
function getStream(version: string, stream: EolConfig['stream']): string {
  return version
    .split('.')
    .slice(0, stream === 'major' ? 1 : 2)
    .join('.');
}

/**
 * Compares two streams numerically, e.g. `3.9` before `3.10`.
 */
function compareStreams(a: string, b: string): number {
  return a.localeCompare(b, 'en', { numeric: true });
}

/**
 * Returns the EOL comment line for a cycle, `TBD` when no EOL date is known.
 */
function getEolComment(cycle: Cycle): string {
  return `# EOL: ${typeof cycle.eol === 'string' ? cycle.eol.slice(0, 7) : 'TBD'}`;
}

/**
 * Splits the trigger file into the preamble and its blocks.
 */
function parse(
  content: string,
  stream: EolConfig['stream'],
): { preamble: string[]; blocks: Block[] } {
  const lines = content.split('\n');
  let start = lines.findIndex((l) => blockStartRe.test(l));
  if (start < 0) {
    start = lines.length;
  }
  const preamble = lines.slice(0, start);
  while (preamble.at(-1)?.trim() === '') {
    preamble.pop();
  }

  const blocks: Block[] = [];
  let group: string[] = [];
  const flush = (): void => {
    if (!group.length) {
      return;
    }
    const versionLine = group.find((l) => versionLineRe.test(l));
    const renovate = group.find((l) => l.startsWith('# renovate:'));
    const m = versionLineRe.exec(versionLine ?? '');
    if (!m?.groups || !renovate) {
      throw new Error(`Unsupported block: ${group.join(' | ')}`);
    }
    const version = m.groups.version!;
    blocks.push({
      stream: getStream(version, stream),
      eol: group.find((l) => l.startsWith('# EOL')),
      extra: group.filter((l) => l !== versionLine && l !== renovate && !l.startsWith('# EOL')),
      renovate,
      prefix: m.groups.prefix!,
      version,
    });
    group = [];
  };
  for (const line of lines.slice(start)) {
    if (line.trim() === '') {
      flush();
    } else {
      group.push(line);
    }
  }
  flush();
  return { preamble, blocks };
}

/**
 * Renders the preamble and the blocks to the file content.
 */
function render(preamble: string[], blocks: Block[]): string {
  const rendered = blocks.map((b) =>
    [...(b.eol ? [b.eol] : []), ...b.extra, b.renovate, `${b.prefix}${b.version}`].join('\n'),
  );
  return [...(preamble.length ? [preamble.join('\n')] : []), ...rendered].join('\n\n') + '\n';
}

/**
 * Updates the trigger file content against the release cycles of endoflife.date.
 * Drops blocks of EOL streams and duplicates, adds blocks for new supported cycles
 * and normalizes the EOL comments.
 */
export function update(content: string, cycles: Cycle[], cfg: EolConfig, today: string): Result {
  const { preamble, blocks } = parse(content, cfg.stream);
  const byCycle = new Map(cycles.map((c) => [c.cycle, c]));
  const summary: string[] = [];
  // `eol: true` is an EOL cycle without a known date
  const isEol = (c: Cycle): boolean =>
    c.eol === true || (typeof c.eol === 'string' && c.eol <= today);

  const seen = new Set<string>();
  const kept: Block[] = [];
  const dropped: Block[] = [];
  for (const block of blocks) {
    if (seen.has(block.stream)) {
      summary.push(`- Removed duplicate \`${block.stream}\``);
      continue;
    }
    seen.add(block.stream);
    const cycle = byCycle.get(block.stream);
    if (!cycle) {
      log.warn(styleText('yellow', 'Unknown stream:'), block.stream);
      kept.push(block);
    } else if (isEol(cycle)) {
      summary.push(
        `- Dropped \`${block.stream}\` (${cycle.eol === true ? 'EOL' : `EOL ${String(cycle.eol)}`})`,
      );
      dropped.push(block);
    } else {
      kept.push(block);
    }
  }
  kept.sort((a, b) => compareStreams(a.stream, b.stream));
  dropped.sort((a, b) => compareStreams(a.stream, b.stream));

  const template = kept.at(-1) ?? dropped.at(-1);
  if (template) {
    // the cycles must be newer than the oldest kept stream, or than the newest dropped one
    const baseline = (kept[0] ?? template).stream;
    const depth = cfg.stream === 'major' ? 1 : 2;
    for (const cycle of [...cycles].sort((a, b) => compareStreams(a.cycle, b.cycle))) {
      if (
        cycle.cycle.split('.').length !== depth ||
        isEol(cycle) ||
        seen.has(cycle.cycle) ||
        compareStreams(cycle.cycle, baseline) <= 0
      ) {
        continue;
      }
      // the version is written into the Dockerfile, so it must be a plain version
      if (!versionRe.test(cycle.latest)) {
        throw new Error(`Invalid latest version of cycle ${cycle.cycle}: ${cycle.latest}`);
      }
      summary.push(`- Added \`${cycle.cycle}\` (${cycle.latest})`);
      kept.push({
        stream: cycle.cycle,
        extra: [],
        renovate: template.renovate,
        prefix: template.prefix,
        version: cycle.latest,
      });
    }
    kept.sort((a, b) => compareStreams(a.stream, b.stream));
  } else {
    log.warn('No block found to use as template');
  }

  for (const block of kept) {
    const cycle = byCycle.get(block.stream);
    if (cycle) {
      block.eol = getEolComment(cycle);
    }
  }

  const result = render(preamble, kept);
  if (result !== content && !summary.length) {
    summary.push('- Normalized the EOL comments');
  }
  return { content: result, summary: summary.join('\n') };
}

/**
 * Updates the rebuild trigger file of a prebuild repository from endoflife.date.
 * Does nothing without an `eol` config, only logs the result in dry-run mode.
 */
export async function run(): Promise<void> {
  try {
    log.info('Trigger file update started');
    const cfg = await readJson<ConfigFile>(getInput('config') || 'builder.json');

    if (!isObject(cfg) || !cfg.eol) {
      log.info('No `eol` config, nothing to do');
      setOutput('changed', false);
      setOutput('summary', '');
      return;
    }

    const file = isNonEmptyString(cfg.eol.file) ? cfg.eol.file : 'renovate.Dockerfile';
    const cycles = await got(`https://endoflife.date/api/${cfg.eol.product}.json`, {
      responseType: 'json',
      resolveBodyOnly: true,
    }).then((body) => body as Cycle[]);

    const content = await readFile(file);
    const today = new Date().toISOString().slice(0, 10);
    const result = update(content, cycles, cfg.eol, today);
    const changed = result.content !== content;

    if (isDryRun()) {
      log.warn(styleText('yellow', '[DRY_RUN] Would write:'), file);
      log(result.content);
    } else if (changed) {
      await writeFile(file, result.content);
    }

    setOutput('changed', changed);
    setOutput('summary', result.summary);
  } catch (err) {
    log.error(err);
    setFailed((err as Error).message);
  }
}
