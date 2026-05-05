#!/usr/bin/env node

import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const binDir = path.dirname(fileURLToPath(import.meta.url));
const cliEntrypoint = path.resolve(binDir, '../dist/cli.js');

if (!existsSync(cliEntrypoint)) {
    process.stderr.write(
        'The @ton/mcp CLI has not been built yet. Run `pnpm --filter @ton/mcp build` from the workspace root and retry.\n',
    );
    process.exit(1);
}

await import(pathToFileURL(cliEntrypoint).href);
