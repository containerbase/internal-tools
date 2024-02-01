export type ExecResult = {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
};

export class ExecError extends Error implements ExecResult {
  override readonly name = 'ExecError';

  constructor(
    public readonly code: number,
    public readonly stdout: string,
    public readonly stderr: string,
    public readonly cmd: string,
  ) {
    super(`ExecError: (${code}) ` + stderr.split('\n').slice(-10).join('\n'));
  }
}

export interface BuildsConfig {
  buildArg: string;
  buildArgs?: string[];
  buildOnly: boolean;
  tagSuffix?: string;
  depName: string;
  imagePrefix: string;
  image: string;
  ignoredVersions: string[];
  majorMinor: boolean;
  lastOnly: boolean;
  dryRun: boolean;
  prune: boolean;
  versioning: string;
}

export type ConfigFile = {
  allowedVersions?: string;
  datasource: string;
  image: string;
  depName?: string;
  lookupName?: string;
  versioning?: string;
  startVersion: string;
  cache?: string;
  buildArg?: string;
  ignoredVersions?: string[];
  forceUnstable?: boolean;
  versions?: string[];
  latestVersion?: string;
  maxVersions?: number;
  extractVersion?: string;
  skipLatestTag?: boolean;
};

export type DockerBuilderConfig = {
  buildArg: string;
  buildArgs?: string[];
  buildOnly: boolean;
  tagSuffix?: string;
  depName: string;
  imagePrefix: string;
  imagePrefixes: string[];
  image: string;
  ignoredVersions: string[];
  majorMinor: boolean;
  lastOnly: boolean;
  dryRun: boolean;
  prune: boolean;
  versioning: string;
  platforms: string[];
} & ConfigFile;

export type BinaryBuilderConfig = {
  buildArgs?: string[];
  depName: string;
  ignoredVersions: string[];
  lastOnly: boolean;
  dryRun: boolean;
  versioning: string;
} & ConfigFile;

export const sumType = 'sha512';
