/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { OnrampCurrency, CurrencySectionConfig } from '../../types';

export interface CurrencySection {
    title: string;
    currencies: OnrampCurrency[];
}

export const filterCurrencies = (currencies: OnrampCurrency[], search: string): OnrampCurrency[] => {
    if (!search) return currencies;
    const lower = search.toLowerCase();
    return currencies.filter((c) => c.name.toLowerCase().includes(lower) || c.code.toLowerCase().includes(lower));
};

export const groupCurrencySections = (
    currencies: OnrampCurrency[],
    sections: CurrencySectionConfig[],
    otherTitle: string,
): CurrencySection[] => {
    const currencyById = new Map(currencies.map((c) => [c.id, c]));
    const assignedIds = new Set<string>();

    const result: CurrencySection[] = sections.map(({ title, ids }) => ({
        title,
        currencies: ids.flatMap((id) => {
            const c = currencyById.get(id);
            if (c) {
                assignedIds.add(id);
                return [c];
            }
            return [];
        }),
    }));

    const remaining = currencies.filter((c) => !assignedIds.has(c.id));
    if (remaining.length > 0) {
        result.push({ title: otherTitle, currencies: remaining });
    }

    return result.filter((s) => s.currencies.length > 0);
};
