import * as core from '@actions/core';
import * as github from '@actions/github';

try {
  // `command` input defined in action metadata file
  const cmd = core.getInput('command');
  console.log(`Executing ${cmd}!`);
  // Get the JSON webhook payload for the event that triggered the workflow
  const payload = JSON.stringify(github.context.payload, undefined, 2);
  console.log(`The event payload: ${payload}`);
} catch (error) {
  core.setFailed(error.message);
}
