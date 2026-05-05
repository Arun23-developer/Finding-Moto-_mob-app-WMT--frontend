import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const port = env.VITE_PORT ? parseInt(env.VITE_PORT, 10) : 3000;
  const proxyTarget = (env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:5000').trim();

  return {
    plugins: [react()],
    build: {
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            charts: ['recharts'],
            ui: ['@radix-ui/react-dialog', '@radix-ui/react-label', '@radix-ui/react-separator', '@radix-ui/react-slot', '@radix-ui/react-switch'],
            network: ['axios', 'socket.io-client'],
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    server: {
      port,
      hmr: {
        port,
      },
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
        '/uploads': {
          target: proxyTarget,
          changeOrigin: true,
        }
      }
    }
  };
});
