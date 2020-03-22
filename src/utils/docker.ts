import got, { Headers, HTTPError } from 'got';
import wwwAuthenticate from 'www-authenticate';
import chalk from 'chalk';
import log from 'fancy-log';
import { exec } from '../util';

const registry = 'https://index.docker.io';

type DockerManifestV2 = {
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
    const apiCheckUrl = `${registry}/v2/`;
    const apiCheckResponse = await got(apiCheckUrl, { throwHttpErrors: false });
    if (apiCheckResponse.headers['www-authenticate'] === undefined) {
      return {};
    }
    const authenticateHeader = new wwwAuthenticate.parsers.WWW_Authenticate(
      apiCheckResponse.headers['www-authenticate']
    );

    const authUrl = `${authenticateHeader.parms.realm}?service=${authenticateHeader.parms.service}&scope=repository:${repository}:pull`;
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
  ManifestV2 = 'application/vnd.docker.distribution.manifest.v2+json',
}

const shaRe = /(sha256:[a-f0-9]{64})/;

export async function getRemoteImageId(
  repository: string,
  tag = 'latest'
): Promise<string> {
  const headers = await getAuthHeaders(registry, repository);
  headers.accept = DockerContentType.ManifestV2;
  const url = `${registry}/v2/${repository}/manifests/${tag}`;

  try {
    const resp = await got<DockerManifestV2>(url, {
      headers,
      responseType: 'json',
    });
    if (resp.headers['content-type'] !== DockerContentType.ManifestV2) {
      throw new Error(`Unsupported response: ${resp.headers['content-type']}`);
    }
    return resp.body.config.digest;
  } catch (e) {
    if (e instanceof HTTPError && e.response.statusCode === 404) {
      // no image published yet
      return '<none>';
    }
    log.error(chalk.red('request error'), e);
    throw new Error('Could not find remote image id');
  }
}

export async function getLocalImageId(
  image: string,
  tag = 'latest'
): Promise<string> {
  const res = await exec('docker', [
    'inspect',
    "--format='{{.Id}}'",
    `${image}:${tag}`,
  ]);

  const [, id] = shaRe.exec(res.stdout) ?? [];

  if (!id) {
    log.error(res);
    throw new Error('Could not find local image id');
  }

  return id;
}
