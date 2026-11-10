import {defineConfig} from 'vite';
import {resolve} from 'node:path';
import {filterCatalogModule} from './scripts/lib/public-display.mjs';

/** Keep isolated catalog rows out of the client bundle. Repository JSON stays complete. */
function isolatePublicCatalog() {
  return {
    name: 'isolate-public-catalog',
    enforce: 'pre' as const,
    transform(code: string, id: string) {
      if (!id.includes('/data/')) return null;
      const next = filterCatalogModule(id, code);
      if (next == null) return null;
      return {code: next, map: null};
    },
  };
}

export default defineConfig({
  root: 'web',
  base: process.env.SITE_BASE || '/',
  plugins: [isolatePublicCatalog()],
  build: {outDir: resolve('dist'), emptyOutDir: true, manifest: true},
  server: {host: '127.0.0.1', fs: {allow: ['..']}},
  esbuild: {jsx: 'automatic'},
});
