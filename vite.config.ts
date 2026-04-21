import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import wasm from 'vite-plugin-wasm'
import path from 'path'

const getPackageName = (id: string): string | null => {
  const nodeModulesToken = `${path.sep}node_modules${path.sep}`
  const nodeModulesIndex = id.lastIndexOf(nodeModulesToken)

  if (nodeModulesIndex === -1) return null

  const packagePath = id.slice(nodeModulesIndex + nodeModulesToken.length).split(path.sep)
  if (packagePath[0]?.startsWith('@') && packagePath[1]) {
    return `${packagePath[0]}/${packagePath[1]}`
  }

  return packagePath[0] ?? null
}

const normalizeChunkName = (name: string): string =>
  name
    .replace(/^@/, '')
    .replace(/[\\/]/g, '-')
    .replace(/[^a-zA-Z0-9-_]/g, '-')

const getWalletVendorChunk = (id: string): string | undefined => {
  const packageName = getPackageName(id)
  if (!packageName) return undefined

  if (packageName === 'protobufjs' || packageName.startsWith('@protobufjs/')) {
    return 'wallet-vendor-protobuf'
  }

  if (
    packageName.startsWith('@trezor/') ||
    packageName.startsWith('@ledgerhq/')
  ) {
    return `wallet-vendor-${normalizeChunkName(packageName)}`
  }

  return undefined
}

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
      '@protobufjs/inquire': path.resolve(__dirname, './src/shims/protobuf-inquire.cjs'),
    },
  },
  build: {
    outDir: 'dist',
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks(id) {
          return getWalletVendorChunk(id)
        },
      },
    },
  },
  esbuild: {
    target: 'es2022',
  },
})
