import { build } from 'esbuild';

await build({
  entryPoints: ['./src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  minify: true,
  tsconfig: 'tsconfig.dist.json',
  sourcemap: true,
  // format: "esm", // seperate issue
  outdir: './dist/',
  loader: {
    '.node': 'copy',
  },
  external: ['dtrace-provider'],
});
