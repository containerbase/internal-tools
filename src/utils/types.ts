export type ExecResult = {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
};

export class ExecError extends Error implements ExecResult {
  readonly name = 'ExecError';

  constructor(
    public readonly code: number,
    public readonly stdout: string,
    public readonly stderr: string,
    public readonly cmd: string
  ) {
    super(`ExecError: (${code}) ` + stderr.split('\n').slice(-10).join('\n'));
  }
}
