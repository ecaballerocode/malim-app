import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', 
  // Si quieres que el servidor de desarrollo funcione correctamente en Codespaces/contenedores
  server: {
    host: true, 
    port: 3000, 
  }
});