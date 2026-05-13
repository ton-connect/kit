/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo, useState } from 'react';
import type { JSX } from 'react';

import { CurrencySelect } from '../currency-select-modal';
import { CurrencyItem } from '../currency-item';
import type { AppkitUIToken } from '../../../types/appkit-ui-token';
import { useI18n } from '../../../features/settings/hooks/use-i18n';
import { filterTokens, groupTokenSections } from './utils';

/**
 * Minimal shape every token in {@link TokenSelectModal} must satisfy. Callers may use richer types (e.g., `AppkitUIToken`) — `TokenBase` only fixes the fields the modal reads.
 *
 * @public
 * @category Type
 * @section Shared
 */
export interface TokenBase {
    /** Stable identifier used to match tokens against {@link TokenSectionConfig.ids}. */
    id: string;
    /** Ticker (e.g., `"TON"`) — used for display and search matching. */
    symbol: string;
    /** Human-readable name — used for display and search matching. */
    name: string;
    /** Token contract address — used for exact-address search matching and as the React `key`. */
    address: string;
    /** Optional logo URL. */
    logo?: string;
}

/**
 * Pre-grouped section of tokens as it appears inside {@link TokenSelectModal}.
 *
 * @public
 * @category Type
 * @section Shared
 */
export interface TokenSection<T extends TokenBase = AppkitUIToken> {
    /** Header label rendered above the section. Falsy values hide the header. */
    title: string;
    /** Tokens belonging to this section, in render order. */
    tokens: T[];
}

/**
 * Configuration that maps token `id`s to a named section in {@link TokenSelectModal}. Tokens not covered are placed in an "Other tokens" trailing section.
 *
 * @public
 * @category Type
 * @section Shared
 */
export interface TokenSectionConfig {
    /** Section header label. */
    title: string;
    /** {@link TokenBase.id} values to include in this section, in render order. */
    ids: string[];
}

/**
 * Props accepted by {@link TokenSelectModal}.
 *
 * @public
 * @category Type
 * @section Shared
 */
export interface TokenSelectModalProps<T extends TokenBase = AppkitUIToken> {
    /** Controls modal visibility. */
    open: boolean;
    /** Called when the modal is dismissed (selection, backdrop click, or escape). */
    onClose: () => void;
    /** Full set of tokens available for selection and search. */
    tokens: T[];
    /** Optional sectioning rules. When omitted, all tokens render as a single untitled section. */
    tokenSections?: TokenSectionConfig[];
    /** Called with the picked token. The modal closes and resets its search on selection. */
    onSelect: (token: T) => void;
    /** Modal header title. */
    title: string;
    /** Placeholder shown inside the search input. */
    searchPlaceholder?: string;
}

/**
 * Ready-made token picker modal — renders a search field and a sectioned list of {@link CurrencyItem} rows backed by {@link CurrencySelect}. Search matches by symbol, name, or exact address. Selecting a row fires `onSelect`, closes the modal, and resets the search.
 *
 * @sample docs/examples/src/appkit/components/shared#TOKEN_SELECT_MODAL
 *
 * @public
 * @category Component
 * @section Shared
 */
export const TokenSelectModal = <T extends TokenBase = AppkitUIToken>({
    open,
    onClose,
    tokens,
    tokenSections,
    onSelect,
    title,
    searchPlaceholder,
}: TokenSelectModalProps<T>): JSX.Element => {
    const { t } = useI18n();
    const [search, setSearch] = useState('');

    const displaySections = useMemo((): TokenSection<T>[] => {
        if (search) {
            return [{ title: '', tokens: filterTokens(tokens, search) }];
        }
        if (tokenSections) {
            return groupTokenSections(tokens, tokenSections, t('tokenSelect.otherTokens'));
        }
        return [{ title: '', tokens }];
    }, [tokens, tokenSections, search, t]);

    const isEmpty = displaySections.every((s) => s.tokens.length === 0);

    const handleSelect = (token: T) => () => {
        onSelect(token);
        onClose();
        setSearch('');
    };

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            onClose();
            setSearch('');
        }
    };

    return (
        <CurrencySelect.Modal open={open} onOpenChange={handleOpenChange} title={title}>
            <CurrencySelect.Search searchValue={search} onSearchChange={setSearch} placeholder={searchPlaceholder} />
            <CurrencySelect.ListContainer isEmpty={isEmpty}>
                {displaySections.map((section) => (
                    <CurrencySelect.Section key={section.title}>
                        {section.title && <CurrencySelect.SectionHeader>{section.title}</CurrencySelect.SectionHeader>}
                        {section.tokens.map((token) => (
                            <CurrencyItem
                                key={token.address}
                                icon={token.logo}
                                name={token.name}
                                ticker={token.symbol}
                                onClick={handleSelect(token)}
                            />
                        ))}
                    </CurrencySelect.Section>
                ))}
            </CurrencySelect.ListContainer>
        </CurrencySelect.Modal>
    );
};
