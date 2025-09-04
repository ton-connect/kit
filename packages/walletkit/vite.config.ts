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
        minify: false,
    },
    // define: {
    //     global: 'globalThis',
    // },
    // optimizeDeps: {
    //     include: ['buffer'],
    // },
});
