/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { collectPublicApi } from './collect';
import { extract } from './extract';
import type { Extracted } from './extract';
import { render } from './render';
import type { PackageKey } from './render';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../../..');

const PACKAGES: Record<PackageKey, string> = {
    appkit: 'packages/appkit',
    'appkit-react': 'packages/appkit-react',
};

function parseTargets(argv: string[]): PackageKey[] {
    const flag = argv.find((a) => a.startsWith('--package='));
    const value = flag?.split('=')[1] ?? 'all';
    if (value === 'all') return ['appkit', 'appkit-react'];
    if (value === 'appkit' || value === 'appkit-react') return [value];
    throw new Error(`Unknown --package value: ${value}`);
}

function generateForPackage(pkg: PackageKey): { output: string; entryCount: number } {
    const packagePath = join(REPO_ROOT, PACKAGES[pkg]);
    const collected = collectPublicApi({ packagePath });
    const extracted: Extracted[] = collected.map(extract);

    const missing = extracted
        .map((e) => {
            const tags: string[] = [];
            if (!e.category) tags.push('@category');
            if (!e.section) tags.push('@section');
            return tags.length > 0 ? { name: e.name, sourcePath: e.sourcePath, tags } : null;
        })
        .filter((m): m is { name: string; sourcePath: string; tags: string[] } => m !== null);

    if (missing.length > 0) {
        const list = missing.map((m) => `  - ${m.name}  (${m.sourcePath}) — missing ${m.tags.join(', ')}`).join('\n');
        throw new Error(
            `[${pkg}] ${missing.length} public export(s) missing required JSDoc tags:\n${list}\n\n` +
                `Every @public symbol must declare both @category (top-level group, e.g. \`@category Action\`) and @section (sub-group, e.g. \`@section Balances\`).`,
        );
    }

    const output = render(extracted);
    return { output, entryCount: extracted.length };
}

function main(): void {
    const targets = parseTargets(process.argv.slice(2));

    for (const pkg of targets) {
        const { output, entryCount } = generateForPackage(pkg);
        const outPath = join(REPO_ROOT, 'docs/templates/packages', pkg, 'docs/reference.md');
        const target = `packages/${pkg}/docs/reference.md`;
        const frontMatter = `---\ntarget: ${target}\n---\n\n`;

        mkdirSync(dirname(outPath), { recursive: true });
        writeFileSync(outPath, frontMatter + output);

        const relativePath = outPath.slice(REPO_ROOT.length + 1);
        console.log(`✓ ${relativePath} (${entryCount} entries) → target ${target}`);
    }
}

main();
