import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['bee-192.png', 'bee-512.png'],
      manifest: {
        name: 'Apiario',
        short_name: 'Apiario',
        description: 'Your beekeeping companion — seasonal guides and hive diagnosis',
        theme_color: '#f5a623',
        background_color: '#fffbeb',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'bee-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'bee-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        runtimeCaching: [],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.js',
  },
})
