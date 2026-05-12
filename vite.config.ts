import { defineConfig } from 'vite';

export default defineConfig({
  base: '/black-hole-simulator/',
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
});