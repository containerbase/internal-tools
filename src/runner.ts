import * as _runner from '@actions/core';
import * as github from '@actions/github';

export default function run(): Promise<void> {
  try {
    // `command` input defined in action metadata file
    const cmd = _runner.getInput('command');
    console.log(`Executing ${cmd}!`);
    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(github.context.payload, undefined, 2);
    console.log(`The event payload: ${payload}`);
  } catch (error) {
    _runner.setFailed(error.message);
  }

  return Promise.resolve();
}
