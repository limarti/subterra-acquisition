import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';

const enableVueDevToolsDuringDebug = true;
const isDev = process.env.NODE_ENV === 'development';

export default defineConfig({
  base: './', // Use relative paths for blob URL compatibility
  plugins: [
    vue(),
    ...(isDev && enableVueDevToolsDuringDebug ? [vueDevTools()] : []),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  build: {
    assetsInlineLimit: 10000000,  //forcing assets to be inlined. otherwise images acced externally were not working in blob URL mode, for the iframe preview dashboard
    chunkSizeWarningLimit: 600,
    cssCodeSplit: false,
    minify: "terser",
    terserOptions: {
      mangle: {
        eval: true,
        module: true,
        toplevel: true,
        safari10: true,
        properties: false
      },
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      output: {
        // Use predictable filenames for easier extraction
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  }
});
