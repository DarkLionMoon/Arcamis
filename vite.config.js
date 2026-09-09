import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();

function copyStaticAssets() {
  const directories = ['scripts/js', 'content', 'images', 'audio', 'imprese-standalone'];
  const files = ['sw.js', 'robots.txt', 'sitemap.xml', 'cover.webp', 'mappa.webp', 'Artboard_1.png'];

  function emitTree(pluginContext, relativeDir) {
    const absoluteDir = path.join(projectRoot, relativeDir);
    if (!fs.existsSync(absoluteDir)) return;

    for (const entry of fs.readdirSync(absoluteDir, { withFileTypes: true })) {
      const relativePath = path.join(relativeDir, entry.name);
      if (entry.isDirectory()) emitTree(pluginContext, relativePath);
      else
        pluginContext.emitFile({
          type: 'asset',
          fileName: relativePath.replaceAll(path.sep, '/'),
          source: fs.readFileSync(path.join(projectRoot, relativePath)),
        });
    }
  }

  return {
    name: 'copy-static-assets',
    generateBundle() {
      for (const directory of directories) emitTree(this, directory);
      for (const file of files) {
        const absoluteFile = path.join(projectRoot, file);
        if (fs.existsSync(absoluteFile)) {
          this.emitFile({ type: 'asset', fileName: file, source: fs.readFileSync(absoluteFile) });
        }
      }
    },
  };
}

export default defineConfig({
  root: '.',
  plugins: [copyStaticAssets()],
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
