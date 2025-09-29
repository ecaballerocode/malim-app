import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 💡 CLAVE: Asegura que la ruta base para todos los activos sea la raíz.
  base: '/', 
  
  // 💡 CLAVE: Configuración de build específica para despliegues estáticos como Vercel
  build: {
    // Especifica dónde deben ir los archivos de salida (por defecto 'dist')
    outDir: 'dist',
    // Asegura que las rutas de los activos (assets) sean correctas
    rollupOptions: {
      output: {
        // Garantiza que los archivos estáticos tengan un prefijo de raíz.
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
