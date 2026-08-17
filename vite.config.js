import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'vendor-animation': ['framer-motion'],
          'vendor-icons': ['lucide-react'],
          'vendor-i18n': ['i18next', 'react-i18next']
        }
      }
    }
  }
})
