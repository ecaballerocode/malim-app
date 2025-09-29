import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 💡 CAMBIO CLAVE: Usamos './' para forzar rutas relativas en producción.
  // Esto asegura que el JS, CSS e imágenes se carguen sin problemas de ruta.
  base: './', 
  
  // Configuración de build específica para despliegues estáticos como Vercel
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
  
  // Si quieres que el servidor de desarrollo funcione correctamente en Codespaces/contenedores
  server: {
    host: true, 
    port: 3000, 
  }
});
