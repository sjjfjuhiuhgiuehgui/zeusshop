// web/vite.config.js
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = env.VITE_BASE || '/'

  return {
    base,
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:8080',   // 👈 你的 Go 後端
          changeOrigin: true,
        },
      },
    },
    build: { outDir: 'dist', assetsDir: 'assets' },
  }
})
