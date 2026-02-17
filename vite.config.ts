import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import wasm from 'vite-plugin-wasm'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/bitcoinwill/',
  plugins: [
    react(),
    wasm(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    target: 'es2022',
  },
  esbuild: {
    target: 'es2022',
  },
})
