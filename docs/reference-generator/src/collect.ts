/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { Node, Project } from 'ts-morph';
import type { SourceFile, Symbol as TsSymbol } from 'ts-morph';

export interface CollectedSymbol {
    name: string;
    declaration: Node;
    sourceFile: SourceFile;
    /** Path relative to the package's src/ directory. e.g. "actions/balances/get-balance-by-address.ts" */
    sourcePath: string;
    /** Value of the `@section` JSDoc tag. Forms the top-level grouping (e.g. Action, Class, Type). */
    section: string | null;
    /** Value of the `@category` JSDoc tag. Forms the second-level grouping (e.g. Balances, Signing). */
    category: string | null;
}

export interface CollectOptions {
    packagePath: string;
}

export function collectPublicApi(options: CollectOptions): CollectedSymbol[] {
    const { packagePath } = options;
    const tsConfigFilePath = join(packagePath, 'tsconfig.json');

    const project = new Project({ tsConfigFilePath });

    const entryAbsPaths = readEntryPaths(packagePath);
    const seenRealSymbols = new Set<TsSymbol>();
    const collected: CollectedSymbol[] = [];

    for (const entryAbsPath of entryAbsPaths) {
        const sourceFile = project.getSourceFile(entryAbsPath);
        if (!sourceFile) {
            console.warn(`[collect] Entry not found in project: ${entryAbsPath}`);
            continue;
        }

        for (const exportSymbol of sourceFile.getExportSymbols()) {
            const real = unwrapAlias(exportSymbol);
            if (seenRealSymbols.has(real)) continue;
            seenRealSymbols.add(real);

            const decl = real.getDeclarations()[0];
            if (!decl) continue;

            const declSourceFile = decl.getSourceFile();
            const declPath = declSourceFile.getFilePath();

            // Drop re-exports from outside this package (e.g. @ton/appkit re-exporting walletkit,
            // or @ton/appkit-react re-exporting @ton/appkit).
            const srcPrefix = `${packagePath}/src/`;
            if (!declPath.startsWith(srcPrefix)) continue;

            // Opt-in: only symbols whose declaration is annotated with `@public` JSDoc.
            if (!hasPublicTag(decl)) continue;

            collected.push({
                name: exportSymbol.getName(),
                declaration: decl,
                sourceFile: declSourceFile,
                sourcePath: declPath.slice(srcPrefix.length),
                section: readTagValue(decl, 'section'),
                category: readTagValue(decl, 'category'),
            });
        }
    }

    return collected;
}

function getJsDocs(decl: Node) {
    if (Node.isVariableDeclaration(decl)) {
        return decl.getVariableStatement()?.getJsDocs() ?? [];
    }
    return Node.isJSDocable(decl) ? decl.getJsDocs() : [];
}

function hasPublicTag(decl: Node): boolean {
    for (const doc of getJsDocs(decl)) {
        for (const tag of doc.getTags()) {
            if (tag.getTagName() === 'public') return true;
        }
    }
    return false;
}

function readTagValue(decl: Node, tagName: string): string | null {
    for (const doc of getJsDocs(decl)) {
        for (const tag of doc.getTags()) {
            if (tag.getTagName() !== tagName) continue;
            const text = tag.getCommentText()?.trim();
            if (text) return text;
        }
    }
    return null;
}

function unwrapAlias(symbol: TsSymbol): TsSymbol {
    let current = symbol;
    let next = current.getAliasedSymbol();
    while (next) {
        current = next;
        next = current.getAliasedSymbol();
    }
    return current;
}

interface ConditionalExport {
    [condition: string]: string | ConditionalExport;
}
type ExportEntry = string | ConditionalExport;

function readEntryPaths(packagePath: string): string[] {
    const pkg = JSON.parse(readFileSync(join(packagePath, 'package.json'), 'utf-8')) as {
        exports?: Record<string, ExportEntry>;
    };
    const exports = pkg.exports ?? {};
    const entries = new Set<string>();

    for (const [key, value] of Object.entries(exports)) {
        if (key.endsWith('.css')) continue;

        const distPath = pickEntryPath(value);
        if (!distPath) continue;

        const srcRelative = distPath
            .replace(/^\.\//, '')
            .replace(/^dist\/(esm|cjs|types)\//, 'src/')
            .replace(/\.d\.ts$/, '.ts')
            .replace(/\.js$/, '.ts');

        entries.add(join(packagePath, srcRelative));
    }

    return [...entries];
}

function pickEntryPath(value: ExportEntry): string | null {
    if (typeof value === 'string') {
        return value.endsWith('.js') || value.endsWith('.d.ts') ? value : null;
    }
    if (value && typeof value === 'object') {
        const candidates = [value['import'], value['default'], value['types']];
        for (const c of candidates) {
            if (typeof c === 'string') return pickEntryPath(c);
            if (c && typeof c === 'object') return pickEntryPath(c);
        }
    }
    return null;
}
