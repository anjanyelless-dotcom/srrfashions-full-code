import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-static-assets',
      closeBundle() {
        const projectDir = __dirname;
        const outDir = path.resolve(projectDir, 'dist');

        const dirs = ['wp-content', 'wp-includes', 'wp-admin', 'wp-json', 'images', 'fonts'];
        for (const dir of dirs) {
          const src = path.resolve(projectDir, dir);
          const dest = path.resolve(outDir, dir);
          if (fs.existsSync(src)) {
            fs.cpSync(src, dest, { recursive: true, force: true, dereference: true });
          }
        }

        const files = ['global.js'];
        for (const file of files) {
          const src = path.resolve(projectDir, file);
          const dest = path.resolve(outDir, file);
          if (fs.existsSync(src)) {
            fs.cpSync(src, dest);
          }
        }

        // Preserve the original feed and XML files if they exist
        const extraFiles = ['feed', 'comments', 'xmlrpc0db0.php'];
        for (const item of extraFiles) {
          const src = path.resolve(projectDir, item);
          const dest = path.resolve(outDir, item);
          if (fs.existsSync(src)) {
            fs.cpSync(src, dest, { recursive: true, force: true, dereference: true });
          }
        }
      }
    }
  ],
  base: '/',
  server: {
    hmr: {
      overlay: false
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: './index.html'
    }
  }
});
