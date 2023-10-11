import { getArch, getDistro, readFile } from '../util';
import { BinaryBuilderConfig, ConfigFile, sumType } from './types';
import is from '@sindresorhus/is';
import * as escapeStringRegexp from 'escape-string-regexp';

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
  const buildArg = escapeStringRegexp(cfg.buildArg as string);
  const dockerFileRe = new RegExp(
    '# renovate: datasource=(?<datasource>[a-z-]+?) depName=(?<depName>.+?)(?: lookupName=(?<lookupName>.+?))?(?: versioning=(?<versioning>[a-z-]+?))?\\s' +
      `(?:ENV|ARG) ${buildArg}=(?<latestVersion>.*)\\s`,
    'g'
  );
  const dockerfile = await readFile('Dockerfile');
  const m = dockerFileRe.exec(dockerfile);
  if (m && m.groups) {
    checkArgs(cfg, m.groups);
  }
}

export function getBinaryName(
  cfg: BinaryBuilderConfig,
  version: string,
  sum?: boolean | undefined
): string {
  const distro = getDistro();
  const arch = getArch();
  const ext = sum ? `.${sumType}` : '';
  let image = `${cfg.image}-${version}`;
  if (is.nonEmptyString(distro)) {
    image += `-${distro}`;
  }
  if (is.nonEmptyString(arch)) {
    image += `-${arch}`;
  }
  return `${image}.tar.xz${ext}`;
}
