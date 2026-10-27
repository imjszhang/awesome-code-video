import {defineConfig} from 'vite';
import {resolve} from 'node:path';
export default defineConfig({root:'web',base:process.env.SITE_BASE || '/',build:{outDir:resolve('dist'),emptyOutDir:true,manifest:true},server:{host:'127.0.0.1',fs:{allow:['..']}},esbuild:{jsx:'automatic'}});
