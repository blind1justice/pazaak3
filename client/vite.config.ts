import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    nodePolyfills({
      // Enable polyfills for specific globals and modules
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      // Enable polyfill for these Node.js modules
      protocolImports: true,
    }),
  ],
  define: {
    // Inject Buffer globally at build time
    'global': 'globalThis',
    'globalThis.Buffer': 'globalThis.Buffer',
  },
  resolve: {
    alias: {
      // Force Vite to use polyfills instead of externalizing
      util: 'util',
      stream: 'stream-browserify',
      http: 'http-browserify',
      https: 'https-browserify',
      buffer: 'buffer',
      process: 'process/browser',
      events: 'events',
    },
  },
  optimizeDeps: {
    // Force these modules to be included and bundled
    include: [
      'buffer',
      'process/browser',
      'util',
      'stream-browserify',
      'http-browserify',
      'https-browserify',
      'events',
      '@metaplex-foundation/umi',
      '@metaplex-foundation/umi-bundle-defaults',
      '@metaplex-foundation/umi-signer-wallet-adapters',
    ],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
      inject: ['./node_modules/buffer/index.js'],
    },
  },
  build: {
    rollupOptions: {
      plugins: [],
    },
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});
