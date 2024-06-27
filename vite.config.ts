import { env } from 'node:process';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';
import GithubActionsReporter from 'vitest-github-actions-reporter';

const ci = !!env.CI;

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    coverage: {
      reporter: ci ? ['json', 'text'] : ['html', 'text'],
      include: ['src/**/*.{js,ts}'],
    },
    reporters: ci
      ? ['default', new GithubActionsReporter()]
      : ['default', 'html'],
    restoreMocks: true,
    setupFiles: './test/setup.ts',
  },
});
