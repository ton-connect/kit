import fs from 'node:fs';
import path from 'node:path';

export function loadData<T>(name: string): T {
    const data = fs.readFileSync(path.join(__dirname, `${name}.json`), 'utf8');
    if (data) {
        return JSON.parse(data) as T;
    }
    throw new Error('No data');
}
