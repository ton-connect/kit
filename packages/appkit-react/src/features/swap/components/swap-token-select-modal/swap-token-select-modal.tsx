/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import type { FC } from 'react';

import { Input } from '../../../../components/input';
import { Modal } from '../../../../components/modal/modal';
import { SearchIcon } from '../../../../components/search-icon';
import { useI18n } from '../../../settings/hooks/use-i18n';
import type { SwapWidgetToken } from '../swap-widget-provider';
import styles from './swap-token-select-modal.module.css';
import { CurrencyItem } from '../../../balances';

export interface SwapTokenSelectModalProps {
    open: boolean;
    onClose: () => void;
    tokens: SwapWidgetToken[];
    onSelect: (token: SwapWidgetToken) => void;
}

export const SwapTokenSelectModal: FC<SwapTokenSelectModalProps> = ({ open, onClose, tokens, onSelect }) => {
    const { t } = useI18n();
    const [search, setSearch] = useState('');

    const filtered = tokens.filter(
        (token) =>
            token.symbol.toLowerCase().includes(search.toLowerCase()) ||
            token.name.toLowerCase().includes(search.toLowerCase()),
    );

    const handleSelect = (token: SwapWidgetToken) => () => {
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
        <Modal open={open} onOpenChange={handleOpenChange} title={t('swap.selectToken')}>
            <Input.Container className={styles.searchWrapper} size="s">
                <Input.Field>
                    <Input.Slot>
                        <SearchIcon size={24} />
                    </Input.Slot>
                    <Input.Input
                        placeholder={t('swap.searchToken')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoFocus
                    />
                </Input.Field>
            </Input.Container>
            <ul className={styles.list}>
                {filtered.map((token) => (
                    <CurrencyItem
                        key={token.address}
                        icon={token.logo}
                        name={token.name}
                        ticker={token.symbol}
                        onClick={handleSelect(token)}
                    />
                ))}
            </ul>
        </Modal>
    );
};
