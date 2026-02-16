/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { defineConfig } from 'tsup';

import * as packageJson from './package.json';

export default defineConfig({
    entry: ['src/**/*.{ts,tsx,js,jsx,mjs,css}'],
    format: ['esm'],
    bundle: false,
    dts: false,
    clean: true,
    outDir: 'dist',
    external: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime'],
    platform: 'browser',
    target: 'es2020',
    sourcemap: true,
    minify: false,
    treeshake: {
        preset: 'smallest',
    },
    splitting: false,
    esbuildOptions(options) {
        options.jsx = 'automatic';
    },
    define: {
        TON_APPKIT_UI_REACT_VERSION: JSON.stringify(packageJson.version),
    },
    onSuccess: 'tsc --emitDeclarationOnly',
    // onSuccess: async () => {
    //     // Add "use client" directive to all JS/MJS files
    //     const files = getAllFiles('./dist');
    //     files.forEach((file) => {
    //         if (file.endsWith('.mjs') || file.endsWith('.js')) {
    //             const content = readFileSync(file, 'utf8');
    //             if (!content.includes('"use client"') && !content.includes("'use client'")) {
    //                 writeFileSync(file, '"use client";\n' + content);
    //             }
    //         }
    //     });
    //     // eslint-disable-next-line no-console
    //     console.log('✅ Added "use client" directive to dist files');

    //     // Run type checking
    //     try {
    //         execSync('tsc --emitDeclarationOnly', { stdio: 'inherit' });
    //     } catch (e) {
    //         // eslint-disable-next-line no-console
    //         console.error('Failed to generate types', e);
    //     }
    // },
});
