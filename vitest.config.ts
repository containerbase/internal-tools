import { env } from 'node:process';
import tsconfigPaths from 'vite-tsconfig-paths';
import { coverageConfigDefaults, defineConfig } from 'vitest/config';

const ci = !!env.CI;

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    coverage: {
      reporter: ci ? ['json', 'text'] : ['html', 'text'],
      include: ['src/**/*.{js,ts}'],
      exclude: [
        ...coverageConfigDefaults.exclude,
        // TODO: add tests
        'src/utils/github.ts',
      ],
    },
    reporters: ci ? ['default', 'github-actions', 'junit'] : ['default'],
    restoreMocks: true,
    setupFiles: './test/setup.ts',
  },
});
