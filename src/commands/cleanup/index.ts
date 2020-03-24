import { context, GitHub } from '@actions/github';
import { WebhookPayloadPush } from '@octokit/webhooks';
import { isDryRun } from '../../util';
import chalk from 'chalk';
import log from 'fancy-log';

export async function run(): Promise<void> {
  const dryRun = isDryRun();
  const token = process.env.GITHUB_TOKEN || '';
  const { owner, repo } = context.repo;
  const run_id = parseInt(process.env.GITHUB_RUN_ID ?? '');
  const branch = process.env.GITHUB_HEAD_REF ?? context.ref.substr(11);

  if (!token) {
    throw new Error('Missing github token');
  }

  if (!run_id) {
    throw new Error('Missing workflow run id');
  }

  if (!owner || !repo) {
    throw new Error('Missing missing repo');
  }

  if (context.eventName === 'push') {
    const pushPayload = context.payload as WebhookPayloadPush;
    log.info(`The head commit is: ${pushPayload.ref}`);
  }

  const api = new GitHub(token);

  const { data: wf } = await api.actions.getWorkflowRun({
    owner,
    repo,
    run_id,
  });

  const [, workflow_id] = /\/(\d+)$/.exec(wf.workflow_url) ?? [];

  const listWfReq = {
    owner,
    repo,
    workflow_id: parseInt(workflow_id),
    branch,
  };
  const { data: runs } = await api.actions.listWorkflowRuns(listWfReq);

  log(`Workflows to check:`, runs.total_count, runs.workflow_runs.length);

  for (const run of runs.workflow_runs) {
    if (run.status !== 'in_progress' && run.status !== 'queued') {
      continue;
    }
    if (dryRun) {
      log.warn(chalk.yellow('DRY_RUN: Would cancel:'), run.id, run.html_url);
      continue;
    }

    log.dir(run);
    log.warn(chalk.red('DRY_RUN: Cancel:'), run.id, run.html_url);
  }

  log.info(chalk.blue('Processing image finished:'), dryRun);
}
