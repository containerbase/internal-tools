import { env } from 'node:process';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

const ci = !!env.CI;

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    coverage: {
      reporter: ci ? ['json', 'text'] : ['html', 'text'],
      include: ['src/**/*.{js,ts}'],
    },
    reporters: ci ? ['default', 'github-actions'] : ['default', 'html'],
    restoreMocks: true,
    setupFiles: './test/setup.ts',
  },
});
