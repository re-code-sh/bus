import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.png', 'icon.png', 'mapbox-gl-rtl-text.js', 'data/*'],
            manifest: {
                name: 'ایستگاه · Istgah',
                short_name: 'Istgah',
                description: 'نقشه تعاملی حمل‌ونقل عمومی — مترو، BRT و اتوبوس ایران',
                theme_color: '#0e1014',
                background_color: '#0e1014',
                display: 'standalone',
                orientation: 'portrait',
                dir: 'rtl',
                lang: 'fa',
                icons: [
                    {
                        src: 'icon.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'any'
                    },
                    {
                        src: 'icon.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable'
                    }
                ]
            },
            workbox: {
                maximumFileSizeToCacheInBytes: 15 * 1024 * 1024, // 15 MiB to cache offline transit data
                globPatterns: ['**/*.{js,css,html,ico,png,svg,json}']
            }
        })
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '~': path.resolve(__dirname, './src')
        }
    },
    build: {
        chunkSizeWarningLimit: 10000,
        rollupOptions: {
            output: {
                manualChunks: {
                    'maplibre': ['maplibre-gl'],
                    'react-vendor': ['react', 'react-dom']
                }
            }
        }
    }
});
