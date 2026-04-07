/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import type { FC } from 'react';
import { compareAddress } from '@ton/appkit';

import { CurrencySelect } from '../currency-select-modal';
import { CurrencyItem } from '../currency-item';
import type { AppkitUIToken } from '../../types/appkit-ui-token';

export interface TokenSelectModalProps {
    open: boolean;
    onClose: () => void;
    tokens: AppkitUIToken[];
    onSelect: (token: AppkitUIToken) => void;
    title: string;
    searchPlaceholder?: string;
}

export const TokenSelectModal: FC<TokenSelectModalProps> = ({
    open,
    onClose,
    tokens,
    onSelect,
    title,
    searchPlaceholder,
}) => {
    const [search, setSearch] = useState('');

    const filtered = tokens.filter(
        (token) =>
            token.symbol.toLowerCase().includes(search.toLowerCase()) ||
            token.name.toLowerCase().includes(search.toLowerCase()) ||
            compareAddress(token.address, search),
    );

    const handleSelect = (token: AppkitUIToken) => () => {
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
            <CurrencySelect.ListContainer isEmpty={filtered.length === 0}>
                {filtered.map((token) => (
                    <CurrencyItem
                        key={token.address}
                        icon={token.logo}
                        name={token.name}
                        ticker={token.symbol}
                        onClick={handleSelect(token)}
                    />
                ))}
            </CurrencySelect.ListContainer>
        </CurrencySelect.Modal>
    );
};
