import { isNonEmptyString, isString } from '@sindresorhus/is';
import escapeStringRegexp from 'escape-string-regexp';
import { getArch, getDistro, readFile } from '../util';
import { BinaryBuilderConfig, ConfigFile, sumType } from './types';

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
  groups: Record<string, string | undefined>,
): void {
  for (const key of keys) {
    if (!isString(cfg[key]) && isNonEmptyString(groups[key])) {
      cfg[key] = groups[key] as never;
    }
  }
}

export async function readDockerConfig(cfg: ConfigFile): Promise<void> {
  const buildArg = escapeStringRegexp(cfg.buildArg!);
  const dockerFileRe = new RegExp(
    '# renovate: datasource=(?<datasource>[a-z-]+?) depName=(?<depName>.+?)(?: lookupName=(?<lookupName>.+?))?(?: versioning=(?<versioning>[a-z-]+?))?\\s' +
      `(?:ENV|ARG) ${buildArg}=(?<latestVersion>.*)\\s`,
    'g',
  );
  const dockerfile = await readFile('Dockerfile');
  const m = dockerFileRe.exec(dockerfile);
  if (m?.groups) {
    checkArgs(cfg, m.groups);
  }
}

export function getBinaryName(
  cfg: BinaryBuilderConfig,
  version: string,
  sum?: boolean,
): string {
  const distro = getDistro();
  const arch = getArch();
  const ext = sum ? `.${sumType}` : '';
  let image = `${cfg.image}-${version}`;
  if (isNonEmptyString(distro)) {
    image += `-${distro}`;
  }
  if (isNonEmptyString(arch)) {
    image += `-${arch}`;
  }
  return `${image}.tar.xz${ext}`;
}
