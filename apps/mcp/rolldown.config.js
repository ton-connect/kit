import { defineConfig } from 'rolldown';

export default defineConfig({
    input: 'src/index.ts',
    output: {
        dir: 'dist',
        format: 'cjs',
        entryFileNames: '[name].cjs',
        banner: '#!/usr/bin/env node',
    },
    platform: 'node',
    external: [/^@ton\/walletkit/, /^@modelcontextprotocol/, /^zod/],
});
