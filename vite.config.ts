import { env } from 'node:process';
// eslint-disable-next-line import-x/no-rename-default
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';
import GitHubActionsReporter from 'vitest-github-actions-reporter';

const ci = !!env.CI;

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    coverage: {
      reporter: ci ? ['json', 'text'] : ['html', 'text'],
      include: ['src/**/*.{js,ts}'],
    },
    reporters: ci
      ? ['default', new GitHubActionsReporter()]
      : ['default', 'html'],
    restoreMocks: true,
    setupFiles: './test/setup.ts',
  },
});
