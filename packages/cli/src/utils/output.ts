/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import pc from 'picocolors';

const NO_COLOR = !!process.env.NO_COLOR;

function c(fn: (s: string) => string, s: string): string {
    return NO_COLOR ? s : fn(s);
}

export const symbols = {
    success: c(pc.green, '✓'),
    error: c(pc.red, '✗'),
    warning: c(pc.yellow, '!'),
    info: c(pc.cyan, '●'),
};

export function header(title: string): string {
    return `${symbols.info} ${c(pc.bold, title)}\n`;
}

export function successHeader(title: string): string {
    return `${symbols.success} ${c(pc.green, c(pc.bold, title))}\n`;
}

export function errorHeader(title: string): string {
    return `${symbols.error} ${c(pc.red, c(pc.bold, title))}`;
}

export function keyValue(pairs: Array<[string, string | undefined | null]>, indent: number = 2): string {
    const filtered = pairs.filter(([, v]) => v != null) as Array<[string, string]>;
    if (filtered.length === 0) return '';

    const maxKeyLen = Math.max(...filtered.map(([k]) => k.length));
    const lines = filtered.map(([key, value]) => {
        const paddedKey = key.padEnd(maxKeyLen);
        return `${' '.repeat(indent)}${c(pc.dim, paddedKey)}    ${value}`;
    });
    return lines.join('\n');
}

export function printResult(jsonMode: boolean, data: Record<string, unknown>, humanOutput: string): void {
    if (jsonMode) {
        process.stdout.write(JSON.stringify(data, null, 2) + '\n');
    } else {
        process.stdout.write(humanOutput + '\n');
    }
}

export function printError(jsonMode: boolean, message: string, hint?: string): void {
    if (jsonMode) {
        process.stdout.write(JSON.stringify({ success: false, error: message }) + '\n');
    } else {
        process.stderr.write(`${errorHeader(`Error: ${message}`)}\n`);
        if (hint) {
            process.stderr.write(`  ${c(pc.dim, hint)}\n`);
        }
    }
    process.exitCode = 1;
}

export function tableRows(rows: Array<Array<string | undefined>>, indent: number = 2): string {
    if (rows.length === 0) return '';

    const colWidths: number[] = [];
    for (const row of rows) {
        for (let i = 0; i < row.length; i++) {
            const len = (row[i] ?? '').length;
            colWidths[i] = Math.max(colWidths[i] ?? 0, len);
        }
    }

    return rows
        .map((row) => {
            const cells = row.map((cell, i) => (cell ?? '').padEnd(colWidths[i]));
            return ' '.repeat(indent) + cells.join('    ');
        })
        .join('\n');
}

export function dim(s: string): string {
    return c(pc.dim, s);
}

export function bold(s: string): string {
    return c(pc.bold, s);
}

export function green(s: string): string {
    return c(pc.green, s);
}

export function red(s: string): string {
    return c(pc.red, s);
}

export function cyan(s: string): string {
    return c(pc.cyan, s);
}

export function yellow(s: string): string {
    return c(pc.yellow, s);
}
