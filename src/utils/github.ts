// istanbul ignore file
import { context, getOctokit } from '@actions/github';
import type { GitHub } from '@actions/github/lib/utils';
import { RequestError } from '@octokit/request-error';
import is from '@sindresorhus/is';
import { getArch, getDistro, readBuffer, sleep } from '../util';
import log from './logger';
import type { BinaryBuilderConfig } from './types';

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

  upload_url: string;
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

      const rels = await api.paginate(api.rest.repos.listReleases, {
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
    if (e instanceof RequestError && e.status !== 404) {
      throw e;
    }
  }
  return null;
}

async function getRelease(
  api: GitHubOctokit,
  version: string
): Promise<GhRelease | null> {
  try {
    const { data } = await api.rest.repos.getReleaseByTag({
      ...context.repo,
      tag: version,
    });

    releaseCache?.set(version, data);
    return data;
  } catch (err) {
    if (err instanceof RequestError && err.status == 404) {
      return null;
    }
    throw err;
  }
}

async function createRelease(
  api: GitHubOctokit,
  cfg: BinaryBuilderConfig,
  version: string,
  retry = true
): Promise<GhRelease> {
  try {
    let data = await getRelease(api, version);
    if (data) {
      return data;
    }

    ({ data } = await api.rest.repos.createRelease({
      ...context.repo,
      tag_name: version,
      name: version,
      body: getBody(cfg, version),
    }));

    releaseCache?.set(version, data);
    return data;
  } catch (err) {
    if (
      retry &&
      err instanceof RequestError &&
      err.status == 422 &&
      err.response?.data
    ) {
      log(
        'Release probably created by other process, retrying:',
        version,
        err.message
      );
      await sleep(250);
      return await createRelease(api, cfg, version, false);
    }
    throw err;
  }
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
  const { data } = await api.rest.repos.updateRelease({
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
    const buffer = await readBuffer(`.cache/${name}`);

    const { data } = await api.rest.repos.uploadReleaseAsset({
      ...context.repo,
      release_id,
      url: rel.upload_url,
      // fake because api issues https://github.com/octokit/octokit.js/discussions/2087
      data: buffer as never,
      name,
      headers: {
        'content-type': 'application/octet-stream',
        'content-length': buffer.length,
      },
    });

    // cache asset
    rel.assets.push(data);
  } catch (e) {
    if (e instanceof RequestError && e.status !== 404) {
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
