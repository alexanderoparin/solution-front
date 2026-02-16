import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: false, // Не открывать браузер автоматически
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        // Не переписываем путь, так как context-path уже /api на бэкенде
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.error('Proxy error:', err);
          });
        },
      },
    },
  },
})

