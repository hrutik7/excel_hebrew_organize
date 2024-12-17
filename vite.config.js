import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        // No need to rewrite as we've added the prefix in Flask
        // rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})