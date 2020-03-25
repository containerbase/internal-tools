// istanbul ignore file: TODO
import { getInput, info } from '@actions/core';
import { context, GitHub } from '@actions/github';
import { WebhookPayloadPush } from '@octokit/webhooks';
import { isDryRun } from '../../util';
import chalk from 'chalk';

export async function run(): Promise<void> {
  const dryRun = isDryRun();
  const token = getInput('token', { required: true });
  const { owner, repo } = context.repo;
  const run_id = parseInt(process.env.GITHUB_RUN_ID ?? '');
  const branch = process.env.GITHUB_HEAD_REF || context.ref.substr(11);

  if (!run_id) {
    throw new Error('Missing workflow run id');
  }

  if (!owner || !repo) {
    throw new Error('Missing missing repo');
  }

  if (context.eventName === 'push') {
    const pushPayload = context.payload as WebhookPayloadPush;
    info(`The head commit is: ${pushPayload.ref}`);
  }

  // for (const key of Object.keys(process.env).filter(k =>
  //   k.startsWith('GITHUB_')
  // )) {
  //   info(chalk.blue(key) + ': ' + process.env[key]);
  // }

  // console.dir(context);

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
    status: 'in_progress' as never,
  };
  const { data: runs } = await api.actions.listWorkflowRuns(listWfReq);

  info(
    `Workflows to check: ` + runs.total_count + ' ' + runs.workflow_runs.length
  );

  for (const run of runs.workflow_runs) {
    if (
      (run.status !== 'in_progress' && run.status !== 'queued') ||
      run.id === run_id
    ) {
      continue;
    }
    if (dryRun) {
      info(
        chalk.yellow('DRY_RUN: Would cancel: ') + run.id + ' ' + run.html_url
      );
      continue;
    }

    info(chalk.red('DRY_RUN: Cancel: ') + run.id + ' ' + run.html_url);
  }

  info(chalk.blue('Processing image finished: ') + dryRun);
}
