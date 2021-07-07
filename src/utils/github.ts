// istanbul ignore file
import { context, getOctokit } from '@actions/github';
import { GitHub } from '@actions/github/lib/utils';
import is from '@sindresorhus/is';
import { getArch, getDistro, readBuffer } from '../util';
import { BinaryBuilderConfig } from './types';

export { getOctokit };

type GitHubOctokit = InstanceType<typeof GitHub>;

interface GhAsset {
  name: string;
}
interface GhRelease {
  id: number;
  name: string | null;
  body?: string | null;

  assets: GhAsset[];
}

let releaseCache: Map<string, GhRelease> | null = null;

export function getBinaryName(
  cfg: BinaryBuilderConfig,
  version: string
): string {
  const arch = getArch();
  if (is.nonEmptyString(arch)) {
    return `${cfg.image}-${version}-${getDistro()}-${arch}.tar.xz`;
  }
  return `${cfg.image}-${version}-${getDistro()}.tar.xz`;
}

function getBody(cfg: BinaryBuilderConfig, version: string): string {
  return `### Bug Fixes

* **deps:** update dependency ${cfg.image} to v${version}`;
}

async function findRelease(
  api: GitHubOctokit,
  version: string
): Promise<GhRelease | null> {
  try {
    if (!releaseCache) {
      const cache = new Map();

      const rels = await api.paginate(api.repos.listReleases, {
        ...context.repo,
        per_page: 100,
      });

      for (const rel of rels) {
        cache.set(rel.tag_name, rel);
      }

      releaseCache = cache;
    }

    return releaseCache.get(version) ?? null;
  } catch (e) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (e.status !== 404) {
      throw e;
    }
  }
  return null;
}

async function createRelease(
  api: GitHubOctokit,
  cfg: BinaryBuilderConfig,
  version: string
): Promise<GhRelease> {
  const { data } = await api.repos.createRelease({
    ...context.repo,
    tag_name: version,
    name: version,
    body: getBody(cfg, version),
  });

  releaseCache?.set(data.tag_name, data);
  return data;
}

export async function updateRelease(
  api: GitHubOctokit,
  cfg: BinaryBuilderConfig,
  version: string
): Promise<void> {
  const body = getBody(cfg, version);
  const rel = await findRelease(api, version);
  if (rel == null || (rel.name === version && rel.body === body)) {
    return;
  }
  const { data } = await api.repos.updateRelease({
    ...context.repo,
    release_id: rel.id,
    name: version,
    body,
  });

  releaseCache?.set(data.tag_name, data);
}

export async function uploadAsset(
  api: GitHubOctokit,
  cfg: BinaryBuilderConfig,
  version: string
): Promise<void> {
  try {
    let rel = await findRelease(api, version);
    let release_id = rel?.id ?? 0;

    if (rel == null) {
      rel = await createRelease(api, cfg, version);
      release_id = rel.id;
    }

    const name = getBinaryName(cfg, version);

    // fake because api issues
    // https://github.com/octokit/octokit.js/discussions/2087
    const data: string = (await readBuffer(`.cache/${name}`)) as never;

    const { data: asset } = await api.repos.uploadReleaseAsset({
      ...context.repo,
      release_id,
      data,
      name,
      headers: {
        'content-type': 'application/octet-stream',
        'content-length': data.length,
      },
    });

    // cache assed
    rel.assets.push(asset);
  } catch (e) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (e.status !== 404) {
      throw e;
    }
  }
}

export async function hasAsset(
  api: GitHubOctokit,
  cfg: BinaryBuilderConfig,
  version: string
): Promise<boolean> {
  const rel = await findRelease(api, version);
  const name = getBinaryName(cfg, version);

  return rel?.assets.some((a) => a.name === name) ?? false;
}
