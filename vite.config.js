import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Apiario',
        short_name: 'Apiario',
        description: 'Your beekeeping companion — seasonal guides and hive diagnosis',
        theme_color: '#f5a623',
        background_color: '#fffbeb',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'bee-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'bee-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'bee-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'bee-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          {
            name: "This week's tasks",
            short_name: 'Tasks',
            description: 'Open the current season task list',
            url: '/?tab=season',
            icons: [{ src: 'bee-192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'Diagnose a problem',
            short_name: 'Diagnose',
            description: 'Open the hive diagnosis wizard',
            url: '/?tab=diagnose',
            icons: [{ src: 'bee-192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'My Hive',
            short_name: 'My Hive',
            description: 'Profile, log and colonies',
            url: '/?tab=myhive',
            icons: [{ src: 'bee-192.png', sizes: '192x192', type: 'image/png' }],
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff2}'],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.js',
  },
})
