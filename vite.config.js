import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssMinify: true,
    jsMinify: 'terser',
    rollupOptions: {
      input: {
        main: 'index.html',
        admin: 'admin/index.html',
      },
      output: {
        // Preserve original file paths for Cloudflare Pages compatibility
        entryFileNames: 'scripts/js/[name].js',
        chunkFileNames: 'scripts/js/[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            if (assetInfo.name.includes('admin')) return 'admin/styles/[name][extname]';
            return 'scripts/css/[name][extname]';
          }
          return 'assets/[name][extname]';
        },
      },
    },
    // Don't process images - they're served as-is
    assetsInlineLimit: 0,
    sourcemap: false,
  },
  server: {
    port: 3000,
    open: true,
  },
});
