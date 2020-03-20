import got, { Headers } from 'got';
import wwwAuthenticate from 'www-authenticate';
import chalk from 'chalk';
import log from 'fancy-log';
import { exec } from '../util';

const registry = 'https://index.docker.io';

type DockerManifest = {
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

export async function getRemoteImageId(
  repository: string,
  tag = 'latest'
): Promise<string> {
  const headers = await getAuthHeaders(registry, repository);
  headers.accept = 'application/vnd.docker.distribution.manifest.v2+json';
  const url = `${registry}/v2/${repository}/manifests/${tag}`;

  try {
    const manifestResponse = await got<DockerManifest>(url, {
      headers,
      responseType: 'json',
    });
    return manifestResponse.body.config.digest;
  } catch (e) {
    log.error('request error', e);
    throw new Error('Could not find remote image id');
  }
}

const shaRe = /(sha256:[a-f0-9]{64})/;

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
