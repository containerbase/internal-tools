// istanbul ignore file
import { context, getOctokit } from '@actions/github';
import { GitHub } from '@actions/github/lib/utils';
import { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods';
import is from '@sindresorhus/is';
import { getArch, getDistro, readBuffer } from '../util';
import { BinaryBuilderConfig } from './types';

export { getOctokit };

type ReposGetReleaseResponseData =
  RestEndpointMethodTypes['repos']['getReleaseByTag']['response']['data'];
type ReposCreateReleaseResponseData =
  RestEndpointMethodTypes['repos']['createRelease']['response']['data'];

type GitHubOctokit = InstanceType<typeof GitHub>;

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
): Promise<ReposGetReleaseResponseData | null> {
  try {
    const res = await api.repos.getReleaseByTag({
      ...context.repo,
      tag: version,
    });
    return res.data ?? null;
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
): Promise<ReposCreateReleaseResponseData> {
  const { data } = await api.repos.createRelease({
    ...context.repo,
    tag_name: version,
    name: version,
    body: getBody(cfg, version),
  });
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
  await api.repos.updateRelease({
    ...context.repo,
    release_id: rel.id,
    name: version,
    body,
  });
}

export async function uploadAsset(
  api: GitHubOctokit,
  cfg: BinaryBuilderConfig,
  version: string
): Promise<void> {
  try {
    const rel = await findRelease(api, version);
    let release_id = rel?.id ?? 0;

    if (rel == null) {
      const { id } = await createRelease(api, cfg, version);
      release_id = id;
    }

    const name = getBinaryName(cfg, version);
    // fake because api issues
    const data: string = (await readBuffer(`.cache/${name}`)) as never;

    await api.repos.uploadReleaseAsset({
      ...context.repo,
      release_id,
      data,
      name,
      headers: {
        'content-type': 'application/octet-stream',
        'content-length': data.length,
      },
    });
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
