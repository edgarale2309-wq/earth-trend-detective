import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },
  worker: { format: 'es' }, // MapLibre 6 loads its worker as an ES module
  build: { chunkSizeWarningLimit: 1500 },
})
