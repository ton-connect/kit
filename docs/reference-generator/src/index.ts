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

/**
 * URL prefixes used to point cross-package `{@link X}` references at sibling
 * reference pages in the published docs. Keyed by `PackageKey`; appended
 * before `#anchor` when a symbol resolves to a different package.
 */
const PUBLISHED_URL: Record<PackageKey, string> = {
    appkit: '/ecosystem/appkit/reference/appkit',
    'appkit-react': '/ecosystem/appkit/reference/appkit-react',
};

function parseTargets(argv: string[]): PackageKey[] {
    const flag = argv.find((a) => a.startsWith('--package='));
    const value = flag?.split('=')[1] ?? 'all';
    if (value === 'all') return ['appkit', 'appkit-react'];
    if (value === 'appkit' || value === 'appkit-react') return [value];
    throw new Error(`Unknown --package value: ${value}`);
}

function collectForPackage(pkg: PackageKey): Extracted[] {
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

    return extracted;
}

function main(): void {
    const targets = parseTargets(process.argv.slice(2));

    // Collect both packages first so each render pass knows which symbols live
    // in the sibling document and can emit absolute URLs instead of dead local
    // anchors for cross-package `{@link X}` references.
    const collected: Record<PackageKey, Extracted[]> = {
        appkit: collectForPackage('appkit'),
        'appkit-react': collectForPackage('appkit-react'),
    };

    for (const pkg of targets) {
        const externalRefs = new Map<string, string>();
        for (const otherPkg of Object.keys(collected) as PackageKey[]) {
            if (otherPkg === pkg) continue;
            for (const entry of collected[otherPkg]) {
                externalRefs.set(entry.name, PUBLISHED_URL[otherPkg]);
            }
        }

        // Package prefixes for the explicit `{@link pkg:Name}` form. The
        // current package maps to an empty prefix so authors can write
        // qualified links from within their own package and still get local
        // anchors instead of fully-qualified URLs.
        const packagePrefixes = new Map<string, string>();
        for (const otherPkg of Object.keys(collected) as PackageKey[]) {
            packagePrefixes.set(otherPkg, otherPkg === pkg ? '' : PUBLISHED_URL[otherPkg]);
        }

        const output = render(collected[pkg], { externalRefs, packagePrefixes });
        const entryCount = collected[pkg].length;

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
