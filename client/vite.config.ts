import { defineConfig } from 'vite';
// @ts-ignore
import nodePolyfills from 'vite-plugin-node-polyfills';

export default defineConfig({
  resolve: {
    alias: {
      stream: 'stream-browserify',
      'node:stream': 'stream-browserify',
      readable_stream: 'readable-stream',
      util: 'util/',
      'node:util': 'util/',
      buffer: 'buffer/',
      'node:buffer': 'buffer/',
      process: 'process/browser',
      'node:process': 'process/browser',
      crypto: 'crypto-browserify',
      'node:crypto': 'crypto-browserify',
      http: 'stream-http',
      'node:http': 'stream-http',
      https: 'https-browserify',
      'node:https': 'https-browserify',
      os: 'os-browserify',
      path: 'path-browserify',
    },
  },

  optimizeDeps: {
    include: [
      '@metaplex-foundation/umi',
      '@metaplex-foundation/umi-bundle-defaults',
      '@metaplex-foundation/umi-signer-wallet-adapters',
      '@solana/web3.js',
      'stream-browserify',
      'readable-stream',
      'buffer',
      'util',
      'process',
      'crypto-browserify',
      'stream-http',
    ],
    esbuildOptions: {
      target: 'es2020',
    },
  },

  plugins: [
    nodePolyfills({
      protocolImports: true,
    }),
  ],

  define: {
    'process.env': {},
  },

  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});
