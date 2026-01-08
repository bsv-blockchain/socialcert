import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8088,
    open: true,
  },
  build: {
    outDir: 'build',
  },
  resolve: {
    alias: {
      fs: 'rollup-plugin-node-polyfills/polyfills/empty',
    },
  },
})
