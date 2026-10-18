import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  root: '.',
  base: '/admin/',
  publicDir: 'public',
  build: {
    outDir: '../export/admin',
    emptyOutDir: true,
    copyPublicDir: false,
    /* Niente source map: contenevano path assoluti della macchina che compila
       (workbox scrive lo sw in una cartella temporanea) e cambiavano a ogni
       build, quindi `npm run build` sporcava il working tree e la CI non
       poteva confrontare gli artefatti. Il deploy non li ha mai serviti:
       `build-post.mjs` li salta copiando il pannello in dist/admin. */
    sourcemap: false,
    rollupOptions: {
      input: {
        app: 'app.html'
      },
      output: {
        manualChunks: {
          'vendor-vue': ['vue', 'vue-router', 'pinia'],
          'vendor-codemirror': ['@codemirror/view', '@codemirror/state', '@codemirror/lang-markdown'],
          'vendor-zod': ['zod']
        }
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8788',
        changeOrigin: true
      },
      /* In sviluppo l'anteprima dell'editor carica le immagini pubblicate:
         senza proxy resterebbero 404 sotto /admin/. */
      '/images': {
        target: 'http://localhost:8788',
        changeOrigin: true
      }
    }
  },
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'Artboard_1.png'],
      workbox: {
        // The Vue admin has no index.html: its only entry is app.html.
        // The navigation fallback MUST point to a precached document,
        // otherwise the SW throws on navigation and the page stays blank.
        navigateFallback: 'app.html'
      },
      manifest: {
        name: 'Arcamis Admin',
        short_name: 'Admin',
        theme_color: '#080a0e',
        background_color: '#0b0e14',
        display: 'standalone',
        icons: [{ src: '/Artboard_1.png', sizes: '512x512', type: 'image/png' }]
      }
    })
  ],
  resolve: {
    alias: {
      '@': '/src',
      '@features': '/src/features',
      '@shared': '/src/shared',
      '@app': '/src/app'
    }
  }
})
