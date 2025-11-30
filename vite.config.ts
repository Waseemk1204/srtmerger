import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  build: {
    // Minification with esbuild (default, faster than terser)
    minify: 'esbuild',

    // Chunk size warnings
    chunkSizeWarningLimit: 500,

    // Source maps for debugging
    sourcemap: false, // Disable for production for faster builds

    // Rollup optimizations
    rollupOptions: {
      output: {
        // Manual chunks for better caching
        manualChunks: {
          // Vendor chunk
          'react-vendor': ['react', 'react-dom'],

          // Icon library
          'icons': ['lucide-react'],

          // Analytics (rarely changes)
          'analytics': ['@vercel/analytics', '@vercel/speed-insights']
        }
      }
    }
  }
})
