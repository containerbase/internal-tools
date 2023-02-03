import run from './runner';

// https://github.com/renovatebot/renovate/pull/20194
global.__dirname = '.';

// RE2 workaround
const cr = eval(
  `typeof __WEBPACK_EXTERNAL_createRequire !== 'undefined' ? __WEBPACK_EXTERNAL_createRequire : null`
) as typeof import('module')['createRequire'] | null;

if (cr) {
  global.require = cr(import.meta.url);
}

run().catch(console.error);
