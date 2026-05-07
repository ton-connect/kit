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

export interface TokenBase {
    id: string;
    symbol: string;
    name: string;
    address: string;
    logo?: string;
}

export interface TokenSection<T extends TokenBase = AppkitUIToken> {
    title: string;
    tokens: T[];
}

export interface TokenSectionConfig {
    title: string;
    ids: string[];
}

export interface TokenSelectModalProps<T extends TokenBase = AppkitUIToken> {
    open: boolean;
    onClose: () => void;
    tokens: T[];
    tokenSections?: TokenSectionConfig[];
    onSelect: (token: T) => void;
    title: string;
    searchPlaceholder?: string;
}

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
