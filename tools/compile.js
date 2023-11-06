import cp from 'node:child_process';
import util from 'node:util';

const exec = util.promisify(cp.exec);

await exec('ncc build ./index.ts -o ../dist -s --target es2022', {
  cwd: './src',
});
