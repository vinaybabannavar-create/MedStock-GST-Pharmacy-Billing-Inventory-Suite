import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    proxy: {
      '/auth': 'http://127.0.0.1:8000',
      '/medicines': 'http://127.0.0.1:8000',
      '/suppliers': 'http://127.0.0.1:8000',
      '/customers': 'http://127.0.0.1:8000',
      '/batches': 'http://127.0.0.1:8000',
      '/purchases': 'http://127.0.0.1:8000',
      '/sales': 'http://127.0.0.1:8000',
      '/analytics': 'http://127.0.0.1:8000',
      '/stock-ledger': 'http://127.0.0.1:8000',
      '/health': 'http://127.0.0.1:8000',
    }
  }
})
