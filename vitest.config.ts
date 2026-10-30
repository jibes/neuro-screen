import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    coverage: { provider: 'v8', include: ['src/lib/**/*.ts'], reporter: ['text-summary', 'html'] },
  },
});
