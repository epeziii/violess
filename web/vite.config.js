import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  esbuild: {
    loader: { '.js': 'jsx' }
  },
  optimizeDeps: {
    include: ['react-datepicker', 'date-fns']
  },
  server: {
    port: 3000
  },
  build: {
    outDir: 'build'
  }
})

