import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // three.js/R3F is intentionally split into a lazy, Home-only chunk (§10),
    // so the default 500kB warning doesn't apply to it.
    chunkSizeWarningLimit: 1000,
  },
})
