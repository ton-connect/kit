/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

/**
 * Рекурсивно ищет все .spec.ts файлы в директории
 * @param dir - директория для поиска
 * @returns массив путей к spec файлам
 */
function findSpecFiles(dir: string): string[] {
    const files: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...findSpecFiles(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('.spec.ts')) {
            files.push(fullPath);
        }
    }

    return files;
}

/**
 * Извлекает все @allureId из spec файла
 * @param filePath - путь к spec файлу
 * @returns массив allureId найденных в файле
 */
function extractAllureIdsFromFile(filePath: string): string[] {
    const content = fs.readFileSync(filePath, 'utf-8');
    const allureIds: string[] = [];

    // Ищем все строки с test('...@allureId(123)...')
    const regex = /test\s*\(['"](.*?)@allureId\((\d+)\)/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
        allureIds.push(match[2]);
    }

    return allureIds;
}

/**
 * Собирает все @allureId из всех spec файлов в директории e2e
 * @returns массив уникальных allureId
 */
export function collectAllAllureIds(): string[] {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const e2eDir = __dirname;

    const specFiles = findSpecFiles(e2eDir);
    const allIds = new Set<string>();

    for (const specFile of specFiles) {
        const ids = extractAllureIdsFromFile(specFile);
        ids.forEach((id) => allIds.add(id));
    }

    return Array.from(allIds);
}

/**
 * Собирает @allureId только из указанного spec файла
 * @param specFilePath - путь к spec файлу
 * @returns массив allureId из этого файла
 */
export function collectAllureIdsFromSpec(specFilePath: string): string[] {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const fullPath = path.resolve(__dirname, specFilePath);

    return extractAllureIdsFromFile(fullPath);
}
