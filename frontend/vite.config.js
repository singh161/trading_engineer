import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Port Configuration
const FRONTEND_PORT = parseInt(process.env.VITE_PORT || '5173', 10)
const BACKEND_PORT = parseInt(process.env.VITE_API_PORT || '8000', 10)
const BACKEND_URL = process.env.VITE_API_URL || `http://localhost:${BACKEND_PORT}`

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: FRONTEND_PORT,  // Frontend Port: 5173 (configurable via VITE_PORT)
    host: true,            // Allow external connections
    open: true,            // Auto-open browser
    strictPort: false,    // Try next port if busy
    proxy: {
      '/api': {
        target: BACKEND_URL,  // Backend URL: http://localhost:8000
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
