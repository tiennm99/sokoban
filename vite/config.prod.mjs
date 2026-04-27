import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    base: '/sokoban/',
    plugins: [
        svelte(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.png', 'apple-touch-icon.png'],
            manifest: {
                name: 'Sokoban',
                short_name: 'Sokoban',
                description: 'Microban Sokoban puzzles, Svelte edition',
                start_url: '/sokoban/',
                scope: '/sokoban/',
                display: 'standalone',
                orientation: 'any',
                background_color: '#2e3440',
                theme_color: '#5e81ac',
                icons: [
                    { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
                    { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
                    { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
                ]
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,png,svg,webmanifest}']
            }
        })
    ]
});
