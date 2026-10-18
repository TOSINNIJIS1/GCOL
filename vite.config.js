import { defineConfig, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';

const jsxInJs = {
  name: 'jsx-in-js',
  enforce: 'pre',
  transform(code, id) {
    return /\/src\/.*\.js$/.test(id) ? transformWithEsbuild(code, id, { loader: 'jsx', jsx: 'automatic' }) : null;
  }
};
export default defineConfig({
  plugins: [jsxInJs, react({ include: /\.[jt]sx?$/ })],
  optimizeDeps: { esbuildOptions: { loader: { '.js': 'jsx' } } },
  test: { environment: 'jsdom', globals: true, setupFiles: './src/setupTests.js', css: true }
});
