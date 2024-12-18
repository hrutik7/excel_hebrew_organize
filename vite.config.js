import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: isProduction ? 'https://excel-hebrew-organize.onrender.com' : 'http://localhost:5000',
          changeOrigin: true,
          // No need to rewrite as we've added the prefix in Flask
          // rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    }
  }
})