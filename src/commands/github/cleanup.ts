import { getInput } from '@actions/core';
import { GitHub } from '@actions/github';
import { isDryRun, getEnv } from '../../util';
import chalk from 'chalk';
import log from '../../utils/logger';

export async function run(): Promise<void> {
  const dryRun = isDryRun();
  const token = getInput('token', { required: true });
  const [owner, repo] = getEnv('GITHUB_REPOSITORY').split('/');
  const run_id = parseInt(getEnv('GITHUB_RUN_ID'));
  const branch = getEnv('GITHUB_HEAD_REF') || getEnv('GITHUB_REF').substr(11);
  const event = getEnv('GITHUB_EVENT_NAME');

  if (!run_id) {
    throw new Error('Missing workflow run id');
  }

  if (!branch) {
    throw new Error('Missing branch');
  }

  if (!owner || !repo) {
    throw new Error('Missing missing repo');
  }

  if (!event) {
    throw new Error('Missing event');
  }

  const api = new GitHub(token);

  const { data: wf } = await api.actions.getWorkflowRun({
    owner,
    repo,
    run_id,
  });

  const [, workflow_id] = /\/(\d+)$/.exec(wf.workflow_url) ?? [];

  if (!workflow_id) {
    throw new Error('Missing workflow id');
  }

  const { data: runs } = await api.actions.listWorkflowRuns({
    owner,
    repo,
    workflow_id: parseInt(workflow_id),
    branch,
  });

  log.info(
    `Workflows to check: ${runs.workflow_runs.length} of ${runs.total_count}`
  );

  for (const run of runs.workflow_runs) {
    if (run.id === run_id) {
      log(chalk.yellow('Ignore me'), ':', chalk.grey(run.html_url));
      continue;
    }
    if (run.status !== 'in_progress' && run.status !== 'queued') {
      log(
        chalk.yellow(`Ignore state`),
        run.status,
        ':',
        chalk.grey(run.html_url)
      );
      continue;
    }
    if (run.event !== event) {
      log(
        chalk.yellow(`Ignore event`),
        run.event,
        ':',
        chalk.grey(run.html_url)
      );
      continue;
    }
    if (dryRun) {
      log.warn(
        chalk.yellow('[DRY_RUN]'),
        chalk.blue('Would cancel'),
        ':',
        chalk.grey(run.html_url)
      );
      continue;
    }

    log.info(chalk.blue('Cancel: '), chalk.grey(run.html_url));
    await api.actions.cancelWorkflowRun({ owner, repo, run_id: run.id });
  }

  log.info(chalk.blue('Processing finished:'), dryRun);
}
