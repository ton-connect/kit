/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import fs from 'fs/promises';
import path from 'path';

import { ESLint } from 'eslint';
import * as prettier from 'prettier';

import { extractSamplesFromFile } from './extract-samples';

type Placeholder = {
    raw: string;
    body: string;
    dirPath: string;
    sampleName: string;
};

interface TemplateParams {
    target: string;
}

function validateDirPath(dirPath: string): void {
    if (path.isAbsolute(dirPath)) {
        throw new Error(`Absolute paths are not allowed: ${dirPath}`);
    }
    if (dirPath.includes('..')) {
        throw new Error(`Parent directory traversal (..) is not allowed: ${dirPath}`);
    }
}

function isJSXCode(code: string): boolean {
    // Check if code contains JSX syntax (tags like <div>, <span>, etc.)
    const jsxPattern = /<[A-Za-z][A-Za-z0-9]*(\s|>)/;
    return jsxPattern.test(code);
}

async function formatSampleCode(sample: string, filePath?: string): Promise<string> {
    const trimmed = sample.trim();
    if (trimmed === '') {
        return '';
    }

    const isJSX = isJSXCode(trimmed);
    const parser = isJSX ? 'typescript' : 'typescript';
    const tempFilePath = isJSX ? 'temp.tsx' : 'temp.ts';

    const prettierConfig = await prettier.resolveConfig(process.cwd());
    let formatted = await prettier.format(trimmed, {
        ...prettierConfig,
        parser,
    });
    formatted = formatted.trimEnd();

    const eslintConfigPath = path.resolve(process.cwd(), 'eslint.config.js');
    const eslint = new ESLint({
        cwd: process.cwd(),
        overrideConfigFile: eslintConfigPath,
        overrideConfig: {
            rules: {
                'license-header/header': 'off',
            },
        },
        fix: true,
    });

    const results = await eslint.lintText(formatted, {
        filePath: tempFilePath,
    });

    if (results.length > 0 && results[0].output) {
        formatted = results[0].output;
    }

    return formatted.trimEnd();
}

async function findTemplateFiles(): Promise<string[]> {
    const templateDir = path.resolve('template');
    try {
        const stat = await fs.stat(templateDir);
        if (!stat.isDirectory()) {
            return [];
        }
    } catch {
        return [];
    }

    const entries = await fs.readdir(templateDir);
    return entries.filter((name) => name.endsWith('.md')).map((name) => path.join(templateDir, name));
}

function parseTemplateParams(content: string): { params: TemplateParams; body: string } {
    const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/;
    const match = content.match(frontMatterRegex);

    if (!match) {
        throw new Error('Template is missing YAML front matter with required "target" parameter');
    }

    const yamlContent = match[1];
    const body = match[2];

    const targetMatch = yamlContent.match(/^target:\s*(.+)$/m);
    if (!targetMatch) {
        throw new Error('Template YAML front matter is missing required "target" parameter');
    }

    const params: TemplateParams = {
        target: targetMatch[1].trim(),
    };

    return { params, body };
}

async function findTypeScriptFiles(dirPath: string): Promise<string[]> {
    const resolvedDir = path.resolve(dirPath);
    const stat = await fs.stat(resolvedDir);
    if (!stat.isDirectory()) {
        throw new Error(`Path is not a directory: ${dirPath}`);
    }

    const files: string[] = [];
    const entries = await fs.readdir(resolvedDir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(resolvedDir, entry.name);
        if (entry.isDirectory()) {
            const subFiles = await findTypeScriptFiles(fullPath);
            files.push(...subFiles);
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
            files.push(fullPath);
        }
    }

    return files.sort();
}

function parsePlaceholders(content: string): Placeholder[] {
    const placeholders: Placeholder[] = [];
    const re = /%%([^%\n]+)%%/g;
    let match: RegExpExecArray | null;

    while ((match = re.exec(content)) !== null) {
        const raw = match[0];
        const body = match[1].trim();
        const matchIndex = match.index;

        const beforeText = content.slice(0, matchIndex);
        const afterText = content.slice(matchIndex + raw.length);
        const lastBacktickBefore = beforeText.lastIndexOf('`');
        const firstBacktickAfter = afterText.indexOf('`');

        if (lastBacktickBefore !== -1 && firstBacktickAfter !== -1) {
            const textBetween = content.slice(lastBacktickBefore + 1, matchIndex + raw.length + firstBacktickAfter);
            if (!textBetween.includes('\n') || textBetween.split('\n').length <= 3) {
                continue;
            }
        }

        const [dirPart, sampleName] = body.split('#');
        if (!dirPart || !sampleName) {
            throw new Error(`Invalid placeholder "${raw}". Expected format %%DIR_PATH#SAMPLE_NAME%%`);
        }

        const normalizedDir = dirPart.trim();
        validateDirPath(normalizedDir);

        placeholders.push({
            raw,
            body,
            dirPath: normalizedDir,
            sampleName,
        });
    }

    return placeholders;
}

async function resolvePlaceholder(
    cwd: string,
    placeholder: Placeholder,
    sampleCache: Map<string, Map<string, string>>,
): Promise<string> {
    const dirPath = path.resolve(cwd, placeholder.dirPath);

    const files = await findTypeScriptFiles(dirPath);

    const allSamples = new Map<string, string>();
    let sourceFilePath: string | undefined;
    for (const file of files) {
        let fileSamples = sampleCache.get(file);
        if (!fileSamples) {
            const { samples } = await extractSamplesFromFile(file);
            fileSamples = samples;
            sampleCache.set(file, fileSamples);
        }

        for (const [name, code] of fileSamples.entries()) {
            if (name === placeholder.sampleName || name.startsWith(`${placeholder.sampleName}_`)) {
                if (!sourceFilePath) {
                    sourceFilePath = file;
                }
            }
            allSamples.set(name, code);
        }
    }

    // SAMPLE_NAME_1, SAMPLE_NAME_2, ..., SAMPLE_NAME_N
    let sample = allSamples.get(placeholder.sampleName);

    if (!sample) {
        const prefix = `${placeholder.sampleName}_`;
        const parts: Array<{ name: string; code: string; index: number }> = [];

        for (const [name, code] of allSamples.entries()) {
            if (name.startsWith(prefix)) {
                const suffix = name.slice(prefix.length);
                const index = parseInt(suffix, 10);
                if (!isNaN(index)) {
                    parts.push({ name, code, index });
                    if (!sourceFilePath) {
                        // Find the file that contains this sample
                        for (const file of files) {
                            const fileSamples = sampleCache.get(file);
                            if (fileSamples?.has(name)) {
                                sourceFilePath = file;
                                break;
                            }
                        }
                    }
                }
            }
        }

        if (parts.length === 0) {
            throw new Error(
                `Sample "${placeholder.sampleName}" not found in directory "${placeholder.dirPath}" (resolved to ${dirPath})`,
            );
        }

        parts.sort((a, b) => a.index - b.index);
        sample = parts.map((p) => p.code).join('\n\n');
    } else {
        // Find the file that contains this sample
        for (const file of files) {
            const fileSamples = sampleCache.get(file);
            if (fileSamples?.has(placeholder.sampleName)) {
                sourceFilePath = file;
                break;
            }
        }
    }

    const formatted = await formatSampleCode(sample, sourceFilePath);
    const isJSX = isJSXCode(sample);
    const codeBlockLang = isJSX ? 'tsx' : 'ts';

    return ['```' + codeBlockLang, formatted, '```'].join('\n');
}

async function processTemplateFile(templatePath: string): Promise<void> {
    const cwd = process.cwd();
    const templateContent = await fs.readFile(templatePath, 'utf8');

    const { params, body: templateBody } = parseTemplateParams(templateContent);

    const placeholders = parsePlaceholders(templateBody);

    if (placeholders.length === 0) {
        return;
    }

    const sampleCache = new Map<string, Map<string, string>>();

    // Replace placeholders
    let result = templateBody;
    for (const placeholder of placeholders) {
        const injected = await resolvePlaceholder(cwd, placeholder, sampleCache);
        result = result.replace(placeholder.raw, injected);
    }

    // Use target from template parameters
    const outPath = path.resolve(cwd, params.target);
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, result, 'utf8');
    console.log(`Updated markdown: ${path.relative(cwd, outPath)} from ${path.relative(cwd, templatePath)}`);
}

async function main(): Promise<void> {
    const templates = await findTemplateFiles();
    if (templates.length === 0) {
        console.log('No template/*.md files found, nothing to update.');
        return;
    }

    for (const templatePath of templates) {
        console.log(`Processing template: ${templatePath}`);
        await processTemplateFile(templatePath);
    }
}

main().catch((error) => {
    console.error('Failed to update docs from templates:', error);
    process.exit(1);
});
