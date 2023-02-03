import run from './runner';

// https://github.com/renovatebot/renovate/pull/20194
global.__dirname = '.';
run().catch(console.error);
