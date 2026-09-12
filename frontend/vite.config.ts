import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    proxy: {
      '/students': 'http://127.0.0.1:8000',
      '/fees': 'http://127.0.0.1:8000',
      '/pocket-money': 'http://127.0.0.1:8000',
      '/reports': 'http://127.0.0.1:8000',
      '/settings': 'http://127.0.0.1:8000',
      '/auth': 'http://127.0.0.1:8000',
      '/api': 'http://127.0.0.1:8000',
    },
  },
})
