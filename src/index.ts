import { env } from 'node:process';
import run from './runner';

// We don't need it.
// https://docs.renovatebot.com/self-hosted-experimental/#renovate_x_ignore_re2
env.RENOVATE_X_IGNORE_RE2 = 'true';
run().catch(console.error);
