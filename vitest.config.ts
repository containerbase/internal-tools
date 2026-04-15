import { env } from 'node:process';
import { coverageConfigDefaults, defineConfig } from 'vitest/config';

const ci = !!env.CI;

export default defineConfig({
  resolve: { tsconfigPaths: true },
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
    mockReset: true,
    restoreMocks: true,
    setupFiles: './test/setup.ts',
  },
});
