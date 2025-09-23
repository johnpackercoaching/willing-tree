import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Detect deployment target
  // Vercel sets VERCEL env variable, GitHub Pages needs /willing-tree/
  base: process.env.VERCEL ? '/' : (process.env.NODE_ENV === 'production' ? '/willing-tree/' : '/'),
})
