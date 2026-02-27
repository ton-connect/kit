/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Holds live JS objects by string ID so Kotlin can reference them
 * across WebView bridge calls (evaluateJavascript only returns strings).
 */

const store = new Map<string, unknown>();
let nextId = 1;

export function retain(prefix: string, obj: unknown): string {
    const id = `${prefix}_${nextId++}`;
    store.set(id, obj);
    return id;
}

export function retainWithId(id: string, obj: unknown): void {
    store.set(id, obj);
}

export function get<T>(id: string): T | undefined {
    return store.get(id) as T | undefined;
}

export function release(id: string): boolean {
    return store.delete(id);
}
