import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative assets work both at the repository URL and when the dist folder is opened locally.
  base: './',
});
