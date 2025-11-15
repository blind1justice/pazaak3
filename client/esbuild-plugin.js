const { polyfillNode } = require('esbuild-plugin-polyfill-node');

module.exports = function polyfillFactory(options = {}) {
  return polyfillNode({
    polyfillModules: [
      'crypto', 'stream', 'buffer', 'util', 'process', 'assert',
      'http', 'https', 'os', 'path', 'url', 'fs', 'zlib'
    ],
    globals: {
      Buffer: 'buffer',
      global: true,
      process: 'process/browser'
    },
    ...options
  });
};
