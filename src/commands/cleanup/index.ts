// istanbul ignore file: TODO
import { getInput } from '@actions/core';
import { context, GitHub } from '@actions/github';
import { isDryRun } from '../../util';
import chalk from 'chalk';
import log from '../../utils/logger';

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

  const api = new GitHub(token);

  const { data: wf } = await api.actions.getWorkflowRun({
    owner,
    repo,
    run_id,
  });

  const [, workflow_id] = /\/(\d+)$/.exec(wf.workflow_url) ?? [];

  const { data: runs } = await api.actions.listWorkflowRuns({
    owner,
    repo,
    workflow_id: parseInt(workflow_id),
    branch,
  });

  log.warn(
    `Workflows to check: ${runs.workflow_runs.length} of ${runs.total_count}`
  );

  for (const run of runs.workflow_runs) {
    if (run.id === run_id) {
      log(chalk.yellow('Ignore me:'), run.html_url);
      continue;
    }
    if (run.status !== 'in_progress' && run.status !== 'queued') {
      log(chalk.yellow(`Ignore state:`), run.status, run.html_url);
      continue;
    }
    if (run.event !== context.eventName) {
      log(chalk.yellow(`Ignore event:`), run.event, run.html_url);
      continue;
    }
    if (dryRun) {
      log.info(
        chalk.yellow('[DRY_RUN]'),
        chalk.blue('Cancel:'),
        run.id,
        run.html_url
      );
      continue;
    }

    log.info(chalk.blue('Cancel: '), run.html_url);
    await api.actions.cancelWorkflowRun({ owner, repo, run_id: run.id });
  }

  log.info(chalk.blue('Processing finished:'), dryRun);
}
