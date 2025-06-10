import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        background: resolve(__dirname, 'background.js'),
        content: resolve(__dirname, 'content.js')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name].[hash].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    },
    emptyOutDir: true,
    sourcemap: true,
    minify: false,
    target: 'es2020',
    modulePreload: false,
    cssCodeSplit: false,
    write: true,
    assetsInlineLimit: 0
  }
});