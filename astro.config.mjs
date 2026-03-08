import { defineConfig } from 'astro/config';
export default defineConfig({
  output: 'static',
  site: 'https://leeroyjenkins.quest',
  build: { format: 'file' },
});
