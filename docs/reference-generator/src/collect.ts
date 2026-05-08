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
import type { JSDoc, SourceFile, Symbol as TsSymbol } from 'ts-morph';

export interface CollectedSymbol {
    name: string;
    /** Original declaration — used by extract.ts for shape (fields, members, signature). */
    declaration: Node;
    /** Declaration in the local package whose JSDoc tags drive this symbol's metadata.
     * Equals `declaration` for symbols defined in this package, or the local
     * alias-export when the symbol is re-exported from another workspace
     * package via `@extract`. */
    metadataDeclaration: Node;
    /** True when the symbol arrived via `@extract` re-export from another package. */
    extracted: boolean;
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

        const srcPrefix = `${packagePath}/src/`;

        for (const exportSymbol of sourceFile.getExportSymbols()) {
            const real = unwrapAlias(exportSymbol);
            if (seenRealSymbols.has(real)) continue;

            const realDecl = real.getDeclarations()[0];
            if (!realDecl) continue;

            const realDeclPath = realDecl.getSourceFile().getFilePath();
            const realInPkg = realDeclPath.startsWith(srcPrefix);

            // Where to read JSDoc tags from. Normally that's the declaration
            // itself; for cross-package re-exports we read from the alias
            // declaration in our package (the `export { … } from 'pkg'` line)
            // and require an explicit `@extract` opt-in there. When a symbol
            // is re-exported from multiple places, prefer the alias that
            // carries `@extract` + `@public` so the chosen metadata is the
            // documented one, regardless of traversal order.
            let metadataDecl: Node = realDecl;
            let extracted = false;

            if (!realInPkg) {
                const aliasDecls = exportSymbol
                    .getDeclarations()
                    .filter((d) => d.getSourceFile().getFilePath().startsWith(srcPrefix));
                if (aliasDecls.length === 0) continue;
                const annotated = aliasDecls.find((d) => hasExtractTag(d) && hasPublicTag(d));
                if (!annotated) continue;
                metadataDecl = annotated;
                extracted = true;
            } else if (!hasPublicTag(metadataDecl)) {
                continue;
            }

            seenRealSymbols.add(real);

            const sourcePath = realInPkg
                ? realDeclPath.slice(srcPrefix.length)
                : metadataDecl.getSourceFile().getFilePath().slice(srcPrefix.length);

            collected.push({
                name: exportSymbol.getName(),
                declaration: realDecl,
                metadataDeclaration: metadataDecl,
                extracted,
                sourceFile: realDecl.getSourceFile(),
                sourcePath,
                section: readTagValue(metadataDecl, 'section'),
                category: readTagValue(metadataDecl, 'category'),
            });
        }
    }

    return collected;
}

export function getJsDocs(decl: Node): JSDoc[] {
    if (Node.isVariableDeclaration(decl)) {
        return decl.getVariableStatement()?.getJsDocs() ?? [];
    }
    if (Node.isExportSpecifier(decl)) {
        // JSDoc lives on the parent ExportDeclaration (`/** … */ export { Foo } from '…'`).
        // ExportDeclaration is not JSDocable in ts-morph's mixin, so pull the JSDoc nodes from its children.
        return decl
            .getExportDeclaration()
            .getChildren()
            .filter((c): c is JSDoc => Node.isJSDoc(c));
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

function hasExtractTag(decl: Node): boolean {
    for (const doc of getJsDocs(decl)) {
        for (const tag of doc.getTags()) {
            if (tag.getTagName() === 'extract') return true;
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
