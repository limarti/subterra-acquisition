import { defineConfig } from 'vitest/config';

// Separate vitest config for post-build tests
// 
// Why we need this:
// 1. The main vitest config uses jsdom environment for Vue components
// 2. Post-build tests need Node.js environment for file system operations
// 3. Post-build test file uses .build.ts extension to exclude it from regular unit tests
// 4. This config explicitly includes only the post-build test file
// 5. Prevents the post-build test from running during "npm run test:unit"
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/__tests__/postbuild.build.ts'],
  },
});