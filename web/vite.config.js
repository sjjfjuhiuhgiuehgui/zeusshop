// vite.config.js
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  // 讀取 .env、.env.production 等檔案
  const env = loadEnv(mode, process.cwd(), '')
  // 若未設定就用根目錄
  const base = env.VITE_BASE || '/'

  return {
    base,                         // 例：'/' 或 '/shop/'
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
    },
    // 可選：輸出資料夾與資產資料夾
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
    },
  }
})
