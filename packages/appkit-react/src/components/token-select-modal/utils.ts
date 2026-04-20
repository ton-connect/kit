/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { compareAddress } from '@ton/appkit';

import type { AppkitUIToken } from '../../types/appkit-ui-token';
import type { TokenSection, TokenSectionConfig } from './token-select-modal';

export const filterTokens = (tokens: AppkitUIToken[], search: string): AppkitUIToken[] => {
    if (!search) return tokens;
    const lowerSearch = search.toLowerCase();
    return tokens.filter(
        (token) =>
            token.symbol.toLowerCase().includes(lowerSearch) ||
            token.name.toLowerCase().includes(lowerSearch) ||
            compareAddress(token.address, search),
    );
};

/**
 * Converts a flat token list + section configs into TokenSection[] for TokenSelectModal.
 * Tokens not covered by any section config are placed in a final untitled section.
 */
export const groupTokenSections = (
    tokens: AppkitUIToken[],
    sections: TokenSectionConfig[],
    otherTitle = 'Other Tokens',
): TokenSection[] => {
    const tokenById = new Map(tokens.map((t) => [t.id, t]));
    const assignedIds = new Set<string>();

    const result: TokenSection[] = sections.map(({ title, ids }) => {
        const sectionTokens = ids.flatMap((id) => {
            const token = tokenById.get(id);
            if (token) {
                assignedIds.add(id);
                return [token];
            }
            return [];
        });
        return { title, tokens: sectionTokens };
    });

    const remaining = tokens.filter((t) => !assignedIds.has(t.id));
    if (remaining.length > 0) {
        result.push({ title: otherTitle, tokens: remaining });
    }

    return result.filter((s) => s.tokens.length > 0);
};
