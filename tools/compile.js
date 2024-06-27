import { env } from 'node:process';
import { build } from 'esbuild';

await build({
  entryPoints: ['./src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  minify: !!env['CI'],
  tsconfig: 'tsconfig.dist.json',
  sourcemap: true,
  format: 'esm',
  outdir: './dist/',
  loader: {
    '.node': 'copy',
  },
  external: ['dtrace-provider'],
  inject: ['tools/cjs-shim.ts'],
  // https://github.com/microsoft/node-jsonc-parser/issues/57#issuecomment-1634726605
  // https://esbuild.github.io/api/#main-fields
  mainFields: ['module', 'main'],
});
