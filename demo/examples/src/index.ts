/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '../../.env' });

const execAsync = promisify(exec);

const examplesDir = path.dirname(fileURLToPath(import.meta.url));

async function findExampleFiles(): Promise<string[]> {
    const entries = await fs.readdir(examplesDir);
    return entries
        .filter((name) => name.endsWith('.ts') && name !== 'index.ts')
        .map((name) => path.join(examplesDir, name))
        .sort();
}

async function main(): Promise<void> {
    const files = await findExampleFiles();
    console.log(`Running ${files.length} example(s)...\n`);

    let failed = 0;

    for (const file of files) {
        const log = [path.relative(process.cwd(), file)];
        let status = '✅';
        try {
            await execAsync(`pnpm tsx "${file}"`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            status = '❌';
            log.push(`Failed: ${errorMessage.substring(0, 500)}`);
            failed++;
        }
        console.error(`${status} ${log.join(' ')}\n`);
    }
    console.log(`Summary: ${files.length - failed} passed, ${failed} failed`);
    if (failed > 0) {
        process.exit(1);
    }
}

main().catch((error) => {
    console.error('Failed to run examples:', error);
    process.exit(1);
});
