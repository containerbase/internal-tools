import is from '@sindresorhus/is';
import { parse } from 'auth-header';
import * as chalk from 'chalk';
import * as delay from 'delay';
import got, { HTTPError, Headers } from 'got';
import { exists } from '../util';
import { cosign } from './cosign/common';
import { docker } from './docker/common';
import log from './logger';
import { ExecError } from './types';

export function splitImage(image: string): {
  registry: string;
  repository: string;
} {
  const parts = image.split('/');
  if (parts.length > 2) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return { registry: parts[0]!, repository: parts.slice(1).join('/') };
  } else {
    return { registry: 'index.docker.io', repository: image };
  }
}

export type DockerManifestV2 = {
  schemaVersion: number;
  config: {
    digest: string;
  };
};

export async function getAuthHeaders(
  registry: string,
  repository: string
): Promise<Headers> {
  try {
    const apiCheckUrl = `https://${registry}/v2/`;
    const apiCheckResponse = await got(apiCheckUrl, { throwHttpErrors: false });
    if (apiCheckResponse.headers['www-authenticate'] === undefined) {
      return {};
    }
    const { scheme, params } = parse(
      apiCheckResponse.headers['www-authenticate']
    );

    if (
      scheme.toUpperCase() !== 'BEARER' ||
      !is.string(params.realm) ||
      !is.string(params.service)
    ) {
      throw new Error(
        'Failed to obtain docker registry token! Invalid auth header.'
      );
    }

    const authUrl = `${params.realm}?service=${params.service}&scope=repository:${repository}:pull`;
    const authResponse = (
      await got<{ token?: string; access_token?: string }>(authUrl, {
        responseType: 'json',
      })
    ).body;

    const token = authResponse.token || authResponse.access_token;
    if (!token) {
      throw new Error('Failed to obtain docker registry token');
    }
    return {
      authorization: `Bearer ${token}`,
    };
  } catch (err) {
    log.error(chalk.red('auth error'), err);
    throw new Error('Failed to obtain docker registry token');
  }
}

export enum DockerContentType {
  ManifestV1 = 'application/vnd.docker.distribution.manifest.v1+json',
  ManifestV1Signed = 'application/vnd.docker.distribution.manifest.v1+prettyjws',
  ManifestV2 = 'application/vnd.docker.distribution.manifest.v2+json',
}

const shaRe = /(sha256:[a-f0-9]{64})/;

export async function getRemoteImageId(
  registry: string,
  repository: string,
  tag = 'latest'
): Promise<string> {
  const headers = await getAuthHeaders(registry, repository);
  headers.accept = DockerContentType.ManifestV2;
  const url = `https://${registry}/v2/${repository}/manifests/${tag}`;

  try {
    const resp = await got<DockerManifestV2>(url, {
      headers,
      responseType: 'json',
    });

    switch (resp.headers['content-type']) {
      case DockerContentType.ManifestV2:
        return resp.body.config.digest;

      case DockerContentType.ManifestV1:
      case DockerContentType.ManifestV1Signed:
        // something wrong, we need to overwrite existing
        log.warn(
          chalk.yellow('Wrong response'),
          `Wrong response: ${resp.headers['content-type'] as string}`
        );
        return '<error>';

      default:
        throw new Error(
          `Unsupported response: ${resp.headers['content-type'] as string}`
        );
    }
  } catch (e) {
    if (e instanceof HTTPError && e.response.statusCode === 404) {
      // no image published yet
      return '<none>';
    }
    log.error(chalk.red('request error'), (e as Error).message);
    throw new Error('Could not find remote image id');
  }
}

export async function getLocalImageId(
  image: string,
  tag = 'latest'
): Promise<string> {
  const res = await docker('inspect', "--format='{{.Id}}'", `${image}:${tag}`);

  const [, id] = shaRe.exec(res.stdout) ?? [];

  if (!id) {
    log.error(res);
    throw new Error('Could not find local image id');
  }

  return id;
}

export type BuildOptions = {
  image: string;
  imagePrefix: string;
  cache?: string;
  cacheTags?: string[];
  tag?: string;
  dryRun?: boolean;
  buildArgs?: string[];
};

const errors = [
  'unexpected status: 400 Bad Request',
  ': no response',
  'error writing layer blob',
];

function canRetry(err: ExecError): boolean {
  return errors.some((str) => err.stderr.includes(str));
}

export async function build({
  image,
  imagePrefix,
  cache,
  cacheTags,
  tag = 'latest',
  dryRun,
  buildArgs,
}: BuildOptions): Promise<void> {
  const args = [
    'buildx',
    'build',
    '--load',
    `--tag=${imagePrefix}/${image}:${tag}`,
  ];

  if (is.nonEmptyArray(buildArgs)) {
    args.push(...buildArgs.map((b) => `--build-arg=${b}`));
  }

  if (is.string(cache)) {
    const cacheImage = `${imagePrefix}/${cache}:${image.replace(/\//g, '-')}`;
    args.push(`--cache-from=${cacheImage}-${tag}`);

    if (is.nonEmptyArray(cacheTags)) {
      for (const ctag of cacheTags) {
        args.push(`--cache-from=${cacheImage}-${ctag}`);
      }
    }

    if (!dryRun) {
      args.push(`--cache-to=type=registry,ref=${cacheImage}-${tag},mode=max`);
    }
  }

  for (let build = 0; ; build++) {
    try {
      await docker(...args, '.');
      break;
    } catch (e) {
      if (e instanceof ExecError && canRetry(e) && build < 2) {
        log.error(chalk.red(`docker build error on try ${build}`), e);
        await delay(5000);
        continue;
      }
      throw e;
    }
  }
}

type PublishOptions = {
  image: string;
  imagePrefix: string;
  tag: string;
  dryRun?: boolean;
};

export async function publish({
  image,
  imagePrefix,
  tag,
  dryRun,
}: PublishOptions): Promise<void> {
  const imageName = `${imagePrefix}/${image}`;
  const fullName = `${imageName}:${tag}`;
  log.info(chalk.blue('Processing image:'), chalk.yellow(fullName));

  log('Fetch new id');
  const newId = await getLocalImageId(imageName, tag);

  log('Fetch old id');
  const { registry, repository } = splitImage(imageName);
  const oldId = await getRemoteImageId(registry, repository, tag);

  if (oldId === newId) {
    log('Image uptodate, no push nessessary:', chalk.yellow(oldId));
    return;
  }

  log('Publish new image', `${oldId} => ${newId}`);
  if (dryRun) {
    log.warn(chalk.yellow('[DRY_RUN]'), chalk.blue('Would push:'), fullName);
  } else {
    await docker('push', fullName);
    await sign(fullName);
  }
  log.info(chalk.blue('Processing image finished:', newId));
}

async function sign(fullName: string): Promise<void> {
  if (!(await exists('cosign'))) {
    log.warn('Cosign is not installed. Skipping container signing');
    return;
  }

  log('Signing image', fullName);
  await cosign('sign', fullName);
}
