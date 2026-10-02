import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    solid(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'Note Story',
        short_name: 'NoteStory',
        description: 'ScenarioStudio2026 と連動するストーリー専用ノートPWA',
        theme_color: '#0b1f3a',
        background_color: '#0b1f3a',
        display: 'standalone',
        // 端末の向きに合わせる（2026-09-28: portrait 固定だと、入れたアプリ（PWA）がタブレットで横にならなかった）
        orientation: 'any',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,ico,png,svg,webp,md,json,webmanifest,woff2}'],
        navigateFallback: null,
        navigateFallbackDenylist: [/^\/assets\//, /^\/icons\//, /^\/.*\.[^/]+$/],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      },
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        sandbox: 'sandbox.html',
      },
    },
  },
})
