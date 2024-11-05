// istanbul ignore file
/* c8 ignore start */
import { setTimeout } from 'node:timers/promises';
import { context, getOctokit } from '@actions/github';
import type { GitHub } from '@actions/github/lib/utils';
import { got } from 'got';
import { readBuffer, writeFile } from '../util';
import { getBinaryName } from './config';
import log from './logger';
import type { BinaryBuilderConfig } from './types';

export { getOctokit };

type GitHubOctokit = InstanceType<typeof GitHub>;

interface GhAsset {
  name: string;
  browser_download_url: string;

  size: number;
}

interface GhRelease {
  id: number;
  name: string | null;
  body?: string | null;

  assets: GhAsset[];

  upload_url: string;
}

let releaseCache: Map<string, GhRelease> | null = null;

function getBody(cfg: BinaryBuilderConfig, version: string): string {
  return `### Bug Fixes

* **deps:** update dependency ${cfg.image} to v${version}`;
}

type RequestError = Error & {
  status: number;
  response: {
    data: unknown;
  };
};

function isRequestError(err: unknown): err is RequestError {
  return err instanceof Error && 'status' in err;
}

async function findRelease(
  api: GitHubOctokit,
  version: string,
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
    if (isRequestError(e) && e.status !== 404) {
      throw e;
    }
  }
  return null;
}

async function getRelease(
  api: GitHubOctokit,
  version: string,
): Promise<GhRelease | null> {
  try {
    const { data } = await api.rest.repos.getReleaseByTag({
      ...context.repo,
      tag: version,
    });

    releaseCache?.set(version, data);
    return data;
  } catch (err) {
    if (isRequestError(err) && err.status == 404) {
      return null;
    }
    throw err;
  }
}

async function createRelease(
  api: GitHubOctokit,
  cfg: BinaryBuilderConfig,
  version: string,
  latestStable: string | undefined,
  retry = true,
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
      make_latest: latestStable
        ? latestStable === version
          ? 'true'
          : 'false'
        : 'legacy',
    }));

    releaseCache?.set(version, data);
    return data;
  } catch (err) {
    if (
      retry &&
      isRequestError(err) &&
      err.status == 422 &&
      err.response?.data
    ) {
      log(
        'Release probably created by other process, retrying:',
        version,
        err.message,
      );
      await setTimeout(250);
      return await createRelease(api, cfg, version, latestStable, false);
    }
    throw err;
  }
}

export async function updateRelease(
  api: GitHubOctokit,
  cfg: BinaryBuilderConfig,
  version: string,
  latestStable: string | undefined,
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
    make_latest: latestStable
      ? latestStable === version
        ? 'true'
        : 'false'
      : 'legacy',
  });

  releaseCache?.set(data.tag_name, data);
}

export async function uploadAsset(
  api: GitHubOctokit,
  cfg: BinaryBuilderConfig,
  version: string,
  latestStable: string | undefined,
  sum?: boolean,
): Promise<void> {
  const name = getBinaryName(cfg, version, sum);
  const buffer = await readBuffer(`.cache/${name}`);
  await uploadFile(api, cfg, version, name, buffer, latestStable);
}

export async function uploadVersionAsset(
  api: GitHubOctokit,
  cfg: BinaryBuilderConfig,
  version: string,
  latestStable: string | undefined,
): Promise<void> {
  const buffer = Buffer.from(latestStable ?? version, 'utf8');
  await uploadFile(api, cfg, version, 'version', buffer, latestStable);
}

export async function uploadFile(
  api: GitHubOctokit,
  cfg: BinaryBuilderConfig,
  version: string,
  name: string,
  buffer: Buffer,
  latestStable: string | undefined,
): Promise<void> {
  try {
    let rel = await findRelease(api, version);
    let release_id = rel?.id ?? 0;

    if (rel == null) {
      rel = await createRelease(api, cfg, version, latestStable);
      release_id = rel.id;
    }

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
    // don't throw if exist
    // https://docs.github.com/en/rest/releases/assets?apiVersion=2022-11-28#upload-a-release-asset--status-codes
    if (isRequestError(e) && e.status !== 422) {
      throw e;
    }
  }
}

export async function hasAsset(
  api: GitHubOctokit,
  cfg: BinaryBuilderConfig,
  version: string,
  sum?: boolean,
): Promise<boolean> {
  const name = getBinaryName(cfg, version, sum);
  return (await findAsset(api, name, version)) != null;
}

export async function hasVersionAsset(
  api: GitHubOctokit,
  version: string,
): Promise<boolean> {
  return (await findAsset(api, 'version', version)) != null;
}

async function findAsset(
  api: GitHubOctokit,
  name: string,
  version: string,
): Promise<GhAsset | null> {
  const rel = await findRelease(api, version);
  return rel?.assets.find((a) => a.name === name) ?? null;
}

export async function downloadAsset(
  api: GitHubOctokit,
  cfg: BinaryBuilderConfig,
  version: string,
): Promise<boolean> {
  const name = getBinaryName(cfg, version);
  const asset = await findAsset(api, name, version);

  if (!asset) {
    return false;
  }

  try {
    const buffer = await got({
      url: asset.browser_download_url,
      responseType: 'buffer',
      resolveBodyOnly: true,
    });

    if (buffer.length != asset.size) {
      log.error('Wrong binary size');
      return false;
    }

    const name = getBinaryName(cfg, version);
    await writeFile(`.cache/${name}`, buffer);
  } catch (e) {
    // eslint-disable-next-line
    log(`Version ${version} failed: ${e.message}`, e.stack);
    return false;
  }

  return true;
}
