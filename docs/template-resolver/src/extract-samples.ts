/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import fs from 'fs/promises';
import path from 'path';

export interface ExtractResult {
    filePath: string;
    samples: Map<string, string>;
}

const SAMPLE_START = /^\s*\/\/\s*SAMPLE_START:\s*(\w+)\s*$/;
const SAMPLE_END = /^\s*\/\/\s*SAMPLE_END:\s*(\w+)\s*$/;

export async function extractSamplesFromFile(filePath: string): Promise<ExtractResult> {
    filePath = path.resolve(filePath);
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');

    const samples = new Map<string, string>();
    let currentSampleName: string | null = null;
    let currentSampleLines: string[] = [];

    for (let index = 0; index < lines.length; index++) {
        const line = lines[index];
        const startMatch = line.match(SAMPLE_START);
        const endMatch = line.match(SAMPLE_END);

        if (startMatch) {
            if (currentSampleName) {
                throw new Error(`Nested SAMPLE_START at ${filePath}:${index + 1} inside sample "${currentSampleName}"`);
            }
            currentSampleName = startMatch[1];
            currentSampleLines = [];
        } else if (endMatch) {
            const endName = endMatch[1];
            if (!currentSampleName) {
                throw new Error(`SAMPLE_END "${endName}" without matching SAMPLE_START at ${filePath}:${index + 1}`);
            }
            if (endName !== currentSampleName) {
                throw new Error(
                    `SAMPLE_END "${endName}" doesn't match SAMPLE_START "${currentSampleName}" at ${filePath}:${index + 1}`,
                );
            }
            if (samples.has(currentSampleName)) {
                throw new Error(`Duplicate sample name "${currentSampleName}" in file ${filePath}`);
            }
            samples.set(currentSampleName, currentSampleLines.join('\n'));
            currentSampleName = null;
            currentSampleLines = [];
        } else if (currentSampleName) {
            currentSampleLines.push(line);
        }
    }

    if (currentSampleName) {
        throw new Error(`Unclosed sample "${currentSampleName}" in file ${filePath} - missing SAMPLE_END`);
    }

    return {
        filePath,
        samples,
    };
}
