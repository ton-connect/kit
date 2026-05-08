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

let LINKABLE_NAMES: Set<string> = new Set();

export function render(extracted: Extracted[]): string {
    LINKABLE_NAMES = new Set(extracted.map((e) => e.name));

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
    } else {
        lines.push('_No props._');
    }
    appendExamples(lines, entry.examples, entry.samples);
    return lines.join('\n');
}

function renderNamespaceComponent(entry: ExtractedNamespaceComponent, level: HeadingLevel): string {
    const memberLevel = level === '###' ? '####' : '#####';
    const lines: string[] = [];
    lines.push(`${level} ${entry.name}`);
    lines.push('');
    lines.push(resolveLinks(entry.summary ?? TODO_MARKER));
    lines.push('');
    lines.push(`Compound component. Members:`);
    lines.push('');
    for (const member of entry.members) {
        lines.push(`${memberLevel} ${entry.name}.${member.name}`);
        lines.push('');
        lines.push(resolveLinks(member.summary ?? TODO_MARKER));
        lines.push('');
        if (member.props.length > 0) {
            lines.push(renderPropsTable(member.props));
        } else {
            lines.push('_No props._');
        }
        lines.push('');
    }
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
 * Renders a type cell as one or more inline-code "chips":
 *   - linked names → `<a href="#name"><code>Name</code></a>` (chip-link)
 *   - surrounding syntax → `<code>…</code>` (plain chip)
 *
 * Each segment is its own HTML element, so adjacent backtick code spans never
 * sit flush against a markdown link (a combo MDX mishandled in Mintlify) and
 * the link scope stays tight to the type name itself instead of wrapping the
 * whole compound type.
 *
 * Both segment forms collapse to the same `<code>` DOM element Mintlify
 * styles as a chip, matching {@link formatTypeOverride}'s markdown chips.
 */
function formatTypeCell(typeText: string): string {
    if (LINKABLE_NAMES.size === 0) return '`' + escapeForCell(typeText) + '`';

    const names = [...LINKABLE_NAMES].sort((a, b) => b.length - a.length);
    const pattern = new RegExp(`\\b(${names.map(escapeRegex).join('|')})\\b`, 'g');

    const segments: string[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(typeText)) !== null) {
        if (match.index > lastIndex) {
            segments.push(`<code>${escapeHtmlInCell(typeText.slice(lastIndex, match.index))}</code>`);
        }
        segments.push(`<a href="#${slugify(match[1])}"><code>${match[1]}</code></a>`);
        lastIndex = pattern.lastIndex;
    }
    if (segments.length === 0) return '`' + escapeForCell(typeText) + '`';
    if (lastIndex < typeText.length) {
        segments.push(`<code>${escapeHtmlInCell(typeText.slice(lastIndex))}</code>`);
    }
    return segments.join('');
}

function escapeHtmlInCell(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\|/g, '\\|');
}

function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Renders a type-override that the author requested via `{@link X}` at the
 * start of a `@param` or `@returns` description. If the target is documented
 * in this reference, emits a markdown link; otherwise plain inline-code.
 */
function formatTypeOverride(name: string): string {
    if (LINKABLE_NAMES.has(name)) {
        return `[\`${name}\`](#${slugify(name)})`;
    }
    return '`' + name + '`';
}

function slugify(name: string): string {
    return name.toLowerCase();
}

/**
 * Resolves `{@link Foo}` markers (planted by sanitizeJsDocText) into
 * markdown links pointing to `#foo` in this same reference. The author is
 * responsible for using `{@link …}` only with names that exist as headings
 * — otherwise the link will be dead.
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
        const name = text.slice(start + LINK_MARKER_OPEN.length, end).trim();
        out.push(`[\`${name}\`](#${slugify(name)})`);
        cursor = end + LINK_MARKER_CLOSE.length;
    }
    return out.join('');
}
