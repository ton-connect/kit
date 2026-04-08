/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import type { FC } from 'react';

import { CurrencySelect } from '../../../../components/currency-select-modal';
import type { OnrampCurrency } from '../../types';
import { OnrampCurrencyItem } from '../onramp-currency-item';
import { useI18n } from '../../../settings/hooks/use-i18n';

export interface OnrampCurrencySelectModalProps {
    open: boolean;
    onClose: () => void;
    currencies: OnrampCurrency[];
    onSelect: (currency: OnrampCurrency) => void;
}

export const OnrampCurrencySelectModal: FC<OnrampCurrencySelectModalProps> = ({
    open,
    onClose,
    currencies,
    onSelect,
}) => {
    const { t } = useI18n();
    const [search, setSearch] = useState('');

    const filtered = currencies.filter(
        (c) =>
            c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase()),
    );

    const handleSelect = (currency: OnrampCurrency) => () => {
        onSelect(currency);
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
        <CurrencySelect.Modal open={open} onOpenChange={handleOpenChange} title={t('onramp.selectCurrency')}>
            <CurrencySelect.Search
                searchValue={search}
                onSearchChange={setSearch}
                placeholder={t('onramp.searchCurrency')}
            />

            <CurrencySelect.ListContainer isEmpty={filtered.length === 0}>
                {filtered.map((currency) => (
                    <OnrampCurrencyItem key={currency.code} currency={currency} onClick={handleSelect(currency)} />
                ))}
            </CurrencySelect.ListContainer>
        </CurrencySelect.Modal>
    );
};
