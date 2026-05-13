/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { LINK_MARKER_CLOSE, LINK_MARKER_OPEN } from './extract';
import type {
    Extracted,
    ExtractedClass,
    ExtractedComponent,
    ExtractedFunction,
    ExtractedNamespaceComponent,
    ExtractedType,
    ParamRow,
} from './extract';

export type PackageKey = 'appkit' | 'appkit-react';

const TODO_MARKER = '_TODO: describe_';

const CATEGORY_ORDER = ['Class', 'Action', 'Hook', 'Component', 'Type', 'Constants'];

/**
 * Symbol-name → URL-prefix map used to resolve unqualified `{@link X}`
 * references and type-cell auto-links. Empty string means "local to this
 * document" (the link resolves to `#anchor`); a non-empty prefix is
 * prepended before `#anchor` so the reference points to a sibling reference
 * page in the published docs.
 */
let LINKABLE: Map<string, string> = new Map();

/**
 * Package-prefix → URL map used to resolve qualified `{@link pkg:Name}`
 * references. The current package is included with an empty prefix so authors
 * can write `{@link appkit-react:Foo}` from inside appkit-react and still get
 * a local anchor.
 */
let PACKAGE_PREFIX: Map<string, string> = new Map();

export interface RenderOptions {
    /** Symbols documented in other packages, keyed by name with their URL prefix as value. */
    externalRefs?: Map<string, string>;
    /** Map of package-key → URL prefix (current package's value should be `""`). Enables `{@link pkg:Name}` syntax. */
    packagePrefixes?: Map<string, string>;
}

export function render(extracted: Extracted[], options: RenderOptions = {}): string {
    const externalRefs = options.externalRefs ?? new Map();
    PACKAGE_PREFIX = options.packagePrefixes ?? new Map();

    LINKABLE = new Map();
    for (const [name, prefix] of externalRefs) LINKABLE.set(name, prefix);
    // Local entries override any external mapping with the same name.
    for (const e of extracted) LINKABLE.set(e.name, '');

    const parts: string[] = [];

    const byCategory = groupByCategory(extracted);
    const categories = sortCategories([...byCategory.keys()]);

    for (const category of categories) {
        const entries = byCategory.get(category)!;
        appendCategoryBlock(parts, category, entries);
    }

    return (
        parts
            .join('\n')
            .replace(/\n{3,}/g, '\n\n')
            .trimEnd() + '\n'
    );
}

function groupByCategory(extracted: Extracted[]): Map<string, Extracted[]> {
    const grouped = new Map<string, Extracted[]>();
    for (const item of extracted) {
        const list = grouped.get(item.category) ?? [];
        list.push(item);
        grouped.set(item.category, list);
    }
    return grouped;
}

function sortCategories(categories: string[]): string[] {
    const known = CATEGORY_ORDER.filter((t) => categories.includes(t));
    const others = categories.filter((t) => !CATEGORY_ORDER.includes(t)).sort();
    return [...known, ...others];
}

function appendCategoryBlock(parts: string[], category: string, entries: Extracted[]): void {
    parts.push(`## ${category}`);
    parts.push('');

    const grouped = new Map<string, Extracted[]>();
    for (const item of entries) {
        const list = grouped.get(item.section) ?? [];
        list.push(item);
        grouped.set(item.section, list);
    }
    for (const list of grouped.values()) {
        list.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    }

    const orderedSections = [...grouped.keys()].sort();

    for (const sectionTitle of orderedSections) {
        const sectionEntries = grouped.get(sectionTitle)!;
        parts.push(`### ${sectionTitle}`);
        parts.push('');
        for (const entry of sectionEntries) {
            parts.push(renderEntry(entry, '####'));
            parts.push('');
        }
    }
}

type HeadingLevel = '###' | '####';

function renderEntry(entry: Extracted, level: HeadingLevel): string {
    switch (entry.kind) {
        case 'function':
            return renderFunction(entry, level);
        case 'component':
            return renderComponent(entry, level);
        case 'componentNamespace':
            return renderNamespaceComponent(entry, level);
        case 'type':
            return renderType(entry, level);
        case 'class':
            return renderClass(entry, level);
    }
}

function renderFunction(entry: ExtractedFunction, level: HeadingLevel): string {
    const lines: string[] = [];
    lines.push(`${level} ${entry.name}`);
    lines.push('');
    lines.push(resolveLinks(entry.summary ?? TODO_MARKER));
    lines.push('');
    if (entry.params.length > 0) {
        lines.push(renderParamsTable(entry.params));
        lines.push('');
    }
    const returnType = entry.returnTypeOverride
        ? formatTypeOverride(entry.returnTypeOverride)
        : formatTypeCell(entry.returnTypeText);
    if (entry.returnDescription) {
        const desc = resolveLinks(entry.returnDescription).replace(/\r?\n/g, ' ');
        lines.push(`Returns: ${returnType} — ${desc}`);
    } else {
        lines.push(`Returns: ${returnType}.`);
    }
    appendExamples(lines, entry.examples, entry.samples);
    return lines.join('\n');
}

function renderComponent(entry: ExtractedComponent, level: HeadingLevel): string {
    const lines: string[] = [];
    lines.push(`${level} ${entry.name}`);
    lines.push('');
    lines.push(resolveLinks(entry.summary ?? TODO_MARKER));
    lines.push('');
    if (entry.props.length > 0) {
        lines.push(renderPropsTable(entry.props));
    }
    appendExamples(lines, entry.examples, entry.samples);
    return lines.join('\n');
}

function renderNamespaceComponent(entry: ExtractedNamespaceComponent, level: HeadingLevel): string {
    const lines: string[] = [];
    lines.push(`${level} ${entry.name}`);
    lines.push('');
    lines.push(resolveLinks(entry.summary ?? TODO_MARKER));
    lines.push('');

    if (entry.members.length === 0) {
        appendExamples(lines, entry.examples, entry.samples);
        return lines.join('\n').trimEnd();
    }

    // When any member declares its own props, fall back to per-member sub-headings
    // so the props table can sit under the member it documents.
    const anyWithProps = entry.members.some((m) => m.props.length > 0);
    if (anyWithProps) {
        const memberLevel = level === '###' ? '####' : '#####';
        lines.push('**Members**');
        lines.push('');
        for (const member of entry.members) {
            lines.push(`${memberLevel} ${entry.name}.${member.name}`);
            lines.push('');
            lines.push(resolveLinks(member.summary ?? TODO_MARKER));
            lines.push('');
            if (member.props.length > 0) {
                lines.push(renderPropsTable(member.props));
                lines.push('');
            }
        }
        appendExamples(lines, entry.examples, entry.samples);
        return lines.join('\n').trimEnd();
    }

    // Compact members table — readable and scannable for sub-components without props.
    lines.push('**Members**');
    lines.push('');
    lines.push('| Member | Description |');
    lines.push('| --- | --- |');
    for (const member of entry.members) {
        const name = `\`${entry.name}.${member.name}\``;
        const desc = resolveLinks(member.summary ?? TODO_MARKER)
            .replace(/\r?\n+/g, ' ')
            .replace(/\|/g, '\\|');
        lines.push(`| ${name} | ${desc} |`);
    }
    lines.push('');
    appendExamples(lines, entry.examples, entry.samples);
    return lines.join('\n').trimEnd();
}

function renderType(entry: ExtractedType, level: HeadingLevel): string {
    const lines: string[] = [];
    lines.push(`${level} ${entry.name}`);
    lines.push('');
    lines.push(resolveLinks(entry.summary ?? TODO_MARKER));
    lines.push('');
    if (entry.fields && entry.fields.length > 0) {
        lines.push(renderFieldsTable(entry.fields));
    } else if (entry.typeText) {
        lines.push('```ts');
        const keyword = entry.isConstant ? 'const' : 'type';
        const operator = entry.isConstant ? '=' : '=';
        lines.push(`${keyword} ${entry.name} ${operator} ${entry.typeText};`);
        lines.push('```');
    } else {
        lines.push('_Empty type._');
    }
    return lines.join('\n');
}

function renderClass(entry: ExtractedClass, level: HeadingLevel): string {
    const lines: string[] = [];
    lines.push(`${level} ${entry.name}`);
    lines.push('');
    lines.push(resolveLinks(entry.summary ?? TODO_MARKER));
    lines.push('');
    if (entry.constructorParams && entry.constructorParams.length > 0) {
        const topLevelNames = entry.constructorParams.filter((p) => !p.name.includes('.')).map((p) => p.name);
        lines.push(`Constructor: \`new ${entry.name}(${topLevelNames.join(', ')})\``);
        lines.push('');
        lines.push(renderParamsTable(entry.constructorParams));
    } else {
        lines.push(`Constructor: \`new ${entry.name}()\``);
    }
    appendExamples(lines, entry.examples, entry.samples);
    return lines.join('\n');
}

function appendExamples(lines: string[], examples: string[], samples: string[]): void {
    const total = examples.length + samples.length;
    if (total === 0) return;
    lines.push('');
    lines.push(total > 1 ? '**Examples**' : '**Example**');
    lines.push('');
    for (const example of examples) {
        lines.push(example);
        lines.push('');
    }
    for (const sample of samples) {
        lines.push(`%%${sample}%%`);
        lines.push('');
    }
}

function renderParamsTable(rows: ParamRow[]): string {
    return renderRowsTable('Parameter', rows);
}

function renderPropsTable(rows: ParamRow[]): string {
    return renderRowsTable('Prop', rows);
}

function renderFieldsTable(rows: ParamRow[]): string {
    return renderRowsTable('Field', rows);
}

function renderRowsTable(firstHeader: string, rows: ParamRow[]): string {
    const headers = [firstHeader, 'Type', 'Description'];
    return renderTable(
        headers,
        rows.map((r) => [
            `\`${r.name}\`${r.required ? '\\*' : ''}`,
            r.typeOverride ? formatTypeOverride(r.typeOverride) : formatTypeCell(r.typeText),
            resolveLinks(r.description ?? TODO_MARKER),
        ]),
    );
}

function renderTable(headers: string[], rows: string[][]): string {
    const lines: string[] = [];
    lines.push(`| ${headers.join(' | ')} |`);
    lines.push(`| ${headers.map(() => '---').join(' | ')} |`);
    for (const row of rows) {
        lines.push(`| ${row.map((cell) => cell.replace(/\r?\n/g, ' ')).join(' | ')} |`);
    }
    return lines.join('\n');
}

function escapeForCell(text: string): string {
    return text.replace(/\|/g, '\\|');
}

/**
 * Renders a type cell as a single `<code>` chip with linked names inlined as
 * `<a>` children. The wrapping `<code>` keeps Mintlify's chip styling unified
 * across the whole compound type (e.g., `ConnectorInput[]` stays one chip
 * instead of fragmenting into a chip-link + plain chip combo), while the
 * inline `<a>` preserves the precise link scope on the symbol name only.
 */
function formatTypeCell(typeText: string): string {
    if (LINKABLE.size === 0) return '`' + escapeForCell(typeText) + '`';

    const names = [...LINKABLE.keys()].sort((a, b) => b.length - a.length);
    const pattern = new RegExp(`\\b(${names.map(escapeRegex).join('|')})\\b`, 'g');

    let body = '';
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let matched = false;
    while ((match = pattern.exec(typeText)) !== null) {
        matched = true;
        if (match.index > lastIndex) {
            body += escapeHtmlInCell(typeText.slice(lastIndex, match.index));
        }
        const prefix = LINKABLE.get(match[1]) ?? '';
        body += `<a href="${prefix}#${slugify(match[1])}">${match[1]}</a>`;
        lastIndex = pattern.lastIndex;
    }
    if (!matched) return '`' + escapeForCell(typeText) + '`';
    if (lastIndex < typeText.length) {
        body += escapeHtmlInCell(typeText.slice(lastIndex));
    }
    return `<code>${body}</code>`;
}

function escapeHtmlInCell(text: string): string {
    // `{`/`}` need entity escapes because Mintlify's MDX parser treats them as
    // JSX-expression delimiters even inside `<code>` blocks.
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\{/g, '&lbrace;')
        .replace(/\}/g, '&rbrace;')
        .replace(/\|/g, '\\|');
}

function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Renders a type-override that the author requested via `{@link X}` (or
 * `{@link pkg:X}`) at the start of a `@param` or `@returns` description.
 * Qualified forms point at the matching sibling reference; unqualified forms
 * use the LINKABLE lookup. Unknown package prefixes throw — same contract as
 * `resolveLinks` — so authors can't accidentally ship a dead chip.
 */
function formatTypeOverride(raw: string): string {
    const colon = raw.indexOf(':');
    if (colon > 0) {
        const pkg = raw.slice(0, colon).trim();
        const name = raw.slice(colon + 1).trim();
        if (!PACKAGE_PREFIX.has(pkg)) {
            const known = [...PACKAGE_PREFIX.keys()].join(', ');
            throw new Error(`Unknown package prefix in {@link ${raw}}. Got "${pkg}"; expected one of: ${known}.`);
        }
        const prefix = PACKAGE_PREFIX.get(pkg) ?? '';
        return `[\`${name}\`](${prefix}#${slugify(name)})`;
    }
    if (LINKABLE.has(raw)) {
        const prefix = LINKABLE.get(raw) ?? '';
        return `[\`${raw}\`](${prefix}#${slugify(raw)})`;
    }
    return '`' + raw + '`';
}

function slugify(name: string): string {
    return name.toLowerCase();
}

/**
 * Resolves `{@link Foo}` markers (planted by sanitizeJsDocText) into markdown
 * links. Two forms are recognized:
 *
 *  - **Qualified** `{@link pkg:Name}` — the prefix names a sibling package
 *    from `PACKAGE_PREFIX`; the link gets that package's URL prefix. Unknown
 *    package prefixes fall through to the unqualified path (treats the colon
 *    as part of the symbol name and emits a dead local anchor).
 *  - **Unqualified** `{@link Foo}` — looked up in `LINKABLE`: local names
 *    resolve to `#anchor`, cross-package names get the sibling reference's
 *    URL prefix, anything else emits a dead local anchor.
 *
 * In both cases the displayed text is the bare symbol name (without the
 * package prefix), so qualified and unqualified forms render identically.
 */
function resolveLinks(text: string): string {
    if (!text.includes(LINK_MARKER_OPEN)) return text;
    const out: string[] = [];
    let cursor = 0;
    while (cursor < text.length) {
        const start = text.indexOf(LINK_MARKER_OPEN, cursor);
        if (start === -1) {
            out.push(text.slice(cursor));
            break;
        }
        out.push(text.slice(cursor, start));
        const end = text.indexOf(LINK_MARKER_CLOSE, start + LINK_MARKER_OPEN.length);
        if (end === -1) {
            out.push(text.slice(start));
            break;
        }
        const raw = text.slice(start + LINK_MARKER_OPEN.length, end).trim();

        const colon = raw.indexOf(':');
        if (colon > 0) {
            const pkg = raw.slice(0, colon).trim();
            const name = raw.slice(colon + 1).trim();
            if (!PACKAGE_PREFIX.has(pkg)) {
                const known = [...PACKAGE_PREFIX.keys()].join(', ');
                throw new Error(`Unknown package prefix in {@link ${raw}}. Got "${pkg}"; expected one of: ${known}.`);
            }
            const prefix = PACKAGE_PREFIX.get(pkg) ?? '';
            out.push(renderUnqualifiedLink(name, prefix));
        } else {
            const prefix = LINKABLE.get(raw) ?? '';
            out.push(renderUnqualifiedLink(raw, prefix));
        }
        cursor = end + LINK_MARKER_CLOSE.length;
    }
    return out.join('');
}

/**
 * Renders a `{@link Name}` (or its already-resolved cross-package counterpart)
 * to a markdown link. Dot-form references like `Foo.Bar` resolve to the parent
 * symbol's anchor (`#foo`) when `Foo` is itself documented — compound members
 * don't get their own anchors, so this keeps the chip linkable to the parent's
 * section where the member is listed.
 */
function renderUnqualifiedLink(name: string, prefix: string): string {
    const dot = name.indexOf('.');
    if (dot > 0) {
        const parent = name.slice(0, dot);
        if (LINKABLE.has(parent)) {
            const parentPrefix = prefix || LINKABLE.get(parent) || '';
            return `[\`${name}\`](${parentPrefix}#${slugify(parent)})`;
        }
    }
    return `[\`${name}\`](${prefix}#${slugify(name)})`;
}
