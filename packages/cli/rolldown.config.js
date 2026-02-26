import { defineConfig } from 'rolldown';

// cfonts and ora must be external because they load runtime assets (font files, spinners)
const external = ['cfonts', 'ora', 'picocolors'];

export default defineConfig([
    {
        input: 'src/index.ts',
        output: {
            dir: 'dist',
            format: 'cjs',
            entryFileNames: '[name].cjs',
        },
        platform: 'node',
        external,
    },
    {
        input: 'src/index.ts',
        output: {
            dir: 'dist',
            format: 'esm',
            entryFileNames: '[name].js',
        },
        platform: 'node',
        external,
    },
    {
        input: 'src/cli.ts',
        output: {
            dir: 'dist',
            format: 'esm',
            entryFileNames: '[name].js',
            banner: '#!/usr/bin/env -S node --no-deprecation',
        },
        platform: 'node',
        external,
    },
]);
