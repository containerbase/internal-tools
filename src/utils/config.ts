import is from '@sindresorhus/is';
import { readFile } from '../util';
import { ConfigFile } from './types';

const keys: (keyof ConfigFile)[] = [
  'datasource',
  'depName',
  'lookupName',
  'buildArg',
  'versioning',
  'latestVersion',
];

function checkArgs(
  cfg: ConfigFile,
  groups: Record<string, string | undefined>
): void {
  for (const key of keys) {
    if (!is.string(cfg[key]) && is.nonEmptyString(groups[key])) {
      cfg[key] = groups[key] as never;
    }
  }
}

export async function readDockerConfig(cfg: ConfigFile): Promise<void> {
  const dockerFileRe = new RegExp(
    '# renovate: datasource=(?<datasource>[a-z-]+?) depName=(?<depName>.+?)(?: lookupName=(?<lookupName>.+?))?(?: versioning=(?<versioning>[a-z-]+?))?\\s' +
      `(?:ENV|ARG) ${cfg.buildArg as string}=(?<latestVersion>.*)\\s`,
    'g'
  );
  const dockerfile = await readFile('Dockerfile');
  const m = dockerFileRe.exec(dockerfile);
  if (m && m.groups) {
    checkArgs(cfg, m.groups);
  }
}
