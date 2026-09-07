// @ts-check
import { defineConfig } from 'astro/config';

import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://bedziedobrze.space', 
  adapter: vercel(),
    build: {
    format: 'directory',
    inlineStylesheets: 'always',
  },

  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  }
});