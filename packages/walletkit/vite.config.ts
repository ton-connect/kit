import { defineConfig } from 'vite';
import { analyzer } from 'vite-bundle-analyzer';

export default defineConfig({
    plugins: [analyzer()],
    build: {
        lib: {
            entry: 'src/index.ts',
            name: 'WalletKit',
            formats: ['es', 'cjs'],
            fileName: (format) => `index.${format === 'es' ? 'mjs' : 'cjs'}`,
        },
        rollupOptions: {
            external: ['buffer'],
        },
        sourcemap: true,
    },
    // Only needed for native build
    // resolve: {
    //     alias: [
    //         {
    //             find: '@ton/crypto-primitives',
    //             replacement: require.resolve('@ton/crypto-primitives/dist/native.js'),
    //         },
    //     ],
    // },
    // define: {
    //     global: 'globalThis',
    // },
    // optimizeDeps: {
    //     include: ['buffer'],
    // },
});
