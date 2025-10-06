import path from 'path';

import { defineConfig } from 'vite';
// import { viteSingleFile } from 'vite-plugin-singlefile';

// https://vite.dev/config/
export default defineConfig({
    plugins: [],
    build: {
        lib: {
            entry: 'js/src/index.ts',
            name: 'index',
        },
        assetsDir: '',
        outDir: 'Packages/TONWalletKit/Sources/TONWalletKit/Resources/JS',
        assetsInlineLimit: () => true,
        rollupOptions: {
            output: {
                // Ensure all JS is inlined into the HTML
                inlineDynamicImports: true,
                // Generate a single chunk
                manualChunks: undefined,
            },
        },
        // Inline all assets including JS and CSS
        // assetsInlineLimit: 100000000, // Large number to inline everything
        // Don't generate separate CSS files
        cssCodeSplit: false,
        minify: false,
        sourcemap: true,
    },
    // Ensure TypeScript files are processed
    esbuild: {
        target: 'es2015',
    },
    resolve: {
        alias: [
            {
                find: '@ton/crypto-primitives',
                replacement: require.resolve('@ton/crypto-primitives/dist/native.js'),
            },
            {
                find: 'expo-crypto',
                replacement: path.resolve('js', 'empty.js'),
            },
            {
                find: 'react-native-fast-pbkdf2',
                replacement: path.resolve('js', 'pbkdf2.js'),
            },
        ],
    },
});
