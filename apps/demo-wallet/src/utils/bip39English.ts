/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { wordlist as englishWordlist } from '@scure/bip39/wordlists/english.js';

const BIP39_ENGLISH = new Set(englishWordlist);

/**
 * Parses pasted mnemonic text into lowercase a–z tokens.
 * Handles commas, semicolons, numbering (e.g. "1."), line breaks and other non-letter separators.
 */
export function extractMnemonicWordsFromPaste(text: string): string[] {
    const trimmed = text.trim();
    if (trimmed.length === 0) {
        return [];
    }

    const normalized = trimmed.normalize('NFKD').toLowerCase();
    const withSpaces = normalized.replace(/[^a-z]+/g, ' ').trim();
    if (withSpaces.length === 0) {
        return [];
    }

    return withSpaces.split(/\s+/).filter((word) => word.length > 0);
}

export type Bip39SlotValidation = {
    nonEmptyWords: string[];
    invalidIndices: readonly number[];
};

export function evaluateBip39Slots(words24: readonly string[]): Bip39SlotValidation {
    const nonEmptyWords = words24.filter((w) => w.trim() !== '');
    const invalidIndices: number[] = [];
    words24.forEach((w, i) => {
        const t = w.trim();
        if (t !== '' && !BIP39_ENGLISH.has(t.toLowerCase())) {
            invalidIndices.push(i);
        }
    });

    return { nonEmptyWords, invalidIndices };
}

export function isImportableBip39(v: Bip39SlotValidation): boolean {
    const n = v.nonEmptyWords.length;
    if (n === 24) return true;
    if (n === 12) return v.invalidIndices.length === 0;
    return false;
}

export type MnemonicPasteResult = {
    nextWords: string[];
    focusIndex: number;
};

/**
 * Applies pasted tokens onto a fixed-length word grid.
 * 12+ tokens at index 0 → full overwrite; otherwise → fill in place from `atIndex`, capped at the grid length.
 * Caller is responsible for skipping empty paste.
 */
export function applyMnemonicPaste(
    currentWords: readonly string[],
    atIndex: number,
    pastedWords: readonly string[],
): MnemonicPasteResult {
    const total = currentWords.length;
    const isFullOverwrite = pastedWords.length >= 12 && atIndex === 0;
    const start = isFullOverwrite ? 0 : atIndex;
    const next = isFullOverwrite ? Array<string>(total).fill('') : [...currentWords];
    const room = total - start;
    const written = pastedWords.slice(0, room);
    written.forEach((word, i) => {
        next[start + i] = word;
    });
    return {
        nextWords: next,
        focusIndex: Math.min(start + Math.max(written.length - 1, 0), total - 1),
    };
}
