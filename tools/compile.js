import { env } from 'node:process';
import { rolldown } from 'rolldown';
import { replacePlugin } from 'rolldown/plugins';

console.log('Bundling ...');
const bundle = await rolldown({
  input: ['./src/index.ts'],
  platform: 'node',
  external: ['dtrace-provider'],
  plugins: [
    replacePlugin(
      {
        'eval("quire".replace(/^/,"re"))': 'require',
      },
      {
        delimiters: ['', ''],
      },
    ),
  ],
});

console.log('Writing bundle ...');
await bundle.write({
  dir: 'dist',
  format: 'esm',
  minify: !!env.CI,
  cleanDir: true,
  sourcemap: true,
});
