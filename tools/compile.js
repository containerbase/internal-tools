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
});
