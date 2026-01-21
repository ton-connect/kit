/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import path from 'path';

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';

export default defineConfig({
    plugins: [
        react(),
        dts({
            insertTypesEntry: true,
        }),
    ],
    optimizeDeps: {
        exclude: ['csstype'],
    },
    build: {
        target: 'es6',
        outDir: 'lib',
        emptyOutDir: true,
        minify: false,
        sourcemap: true,
        lib: {
            formats: ['es', 'cjs'],
            entry: path.resolve('src/index.ts'),
            name: '@ton/appkit-ui-react',
            fileName: (format) => {
                switch (format) {
                    case 'es':
                        return 'index.mjs';
                    case 'cjs':
                        return 'index.cjs';
                    default:
                        throw new Error('Unknown format');
                }
            },
        },
        rollupOptions: {
            external: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', '@ton/appkit-ui'],
            output: {
                globals: {
                    react: 'React',
                    'react-dom': 'ReactDOM',
                    'react-dom/client': 'ReactDOMClient',
                    'react/jsx-runtime': 'ReactJSXRuntime',
                    '@ton/appkit-ui': 'TON_CONNECT_UI',
                },
            },
        },
    },
});
