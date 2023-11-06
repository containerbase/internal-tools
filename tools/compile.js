import shell from 'shelljs';

shell.exec('ncc build ./index.ts -o ../dist -s --target es2022', {
  cwd: './src',
});
