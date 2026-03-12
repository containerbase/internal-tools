import { z } from 'zod';

export interface ExecResult {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
}

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

const ConfigFile = z.object({
  allowedVersions: z.string().optional(),
  datasource: z.string().optional(),
  image: z.string(),
  depName: z.string().optional(),
  lookupName: z.string().optional(),
  versioning: z.string().optional(),
  startVersion: z.string(),
  cache: z.string().optional(),
  buildArg: z.string().optional(),
  ignoredVersions: z.array(z.string()).optional().default([]),
  forceUnstable: z.boolean().optional(),
  versions: z.array(z.string()).optional(),
  latestVersion: z.string().optional(),
  maxVersions: z.number().optional(),
  extractVersion: z.string().optional(),
  skipLatestTag: z.boolean().optional(),

  registryUrls: z.array(z.string()).optional(),

  /**
   * If `true` process versions from highest to lowest,
   * otherwise process from lowest to highest.
   */
  reverse: z.boolean().optional(),
});

export type ConfigFile = z.infer<typeof ConfigFile>;

export const DockerBuilderConfig = ConfigFile.extend({
  buildArg: z.string(),
  buildArgs: z.array(z.string()).optional(),
  buildOnly: z.boolean(),
  tagSuffix: z.string().optional(),

  datasource: z.string(),
  depName: z.string(),

  imagePrefix: z.string(),
  imagePrefixes: z.array(z.string()),
  majorMinor: z.boolean(),
  lastOnly: z.boolean(),
  dryRun: z.boolean().optional(),
  prune: z.boolean(),
  versioning: z.string(),
  platforms: z.array(z.string()),
});

export type DockerBuilderConfig = z.infer<typeof DockerBuilderConfig>;

export type BinaryBuilderConfig = {
  buildArgs?: string[];
  datasource: string;
  depName: string;
  ignoredVersions: string[];
  lastOnly: boolean;
  dryRun?: boolean;
  versioning: string;
} & ConfigFile;

export const sumType = 'sha512';

export interface DockerBuildxMetaData {
  'containerimage.digest'?: string;
}
