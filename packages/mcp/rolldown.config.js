import { defineConfig } from 'rolldown';

// Bundle @ton/walletkit to avoid ESM resolution issues (missing .js extensions)
// Keep MCP SDK and zod as external since they have proper ESM/CJS exports
export default defineConfig([
    {
        input: 'src/index.ts',
        output: {
            dir: 'dist',
            format: 'cjs',
            entryFileNames: '[name].cjs',
        },
        platform: 'node',
        external: [/^@modelcontextprotocol/, /^zod/],
    },
    {
        input: 'src/index.ts',
        output: {
            dir: 'dist',
            format: 'esm',
            entryFileNames: '[name].js',
        },
        platform: 'node',
        external: [/^@modelcontextprotocol/, /^zod/],
    },
    {
        input: 'src/cli.ts',
        output: {
            dir: 'dist',
            format: 'esm',
            entryFileNames: '[name].js',
            banner: '#!/usr/bin/env node',
        },
        platform: 'node',
        external: [/^@modelcontextprotocol/, /^zod/],
    },
]);
