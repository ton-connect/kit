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

import { Input } from '../input/input';
import { Modal } from '../modal/modal';
import { SearchIcon } from '../search-icon';
import { CurrencyItem } from '../../features/balances';
import { useI18n } from '../../features/settings/hooks/use-i18n';
import type { AppkitUIToken } from '../../types/appkit-ui-token';
import styles from './token-select-modal.module.css';

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
    const { t } = useI18n();
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
        <Modal open={open} onOpenChange={handleOpenChange} title={title}>
            <Input.Container className={styles.searchWrapper} size="s">
                <Input.Field>
                    <Input.Slot>
                        <SearchIcon size={24} />
                    </Input.Slot>
                    <Input.Input
                        placeholder={searchPlaceholder}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoFocus
                    />
                </Input.Field>
            </Input.Container>

            <div className={styles.list}>
                {tokens.length === 0 ? (
                    <div className={styles.empty}>
                        <p className={styles.emptyText}>{t('tokenSelect.emptyForNetwork')}</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className={styles.empty}>
                        <p className={styles.emptyText}>{t('tokenSelect.emptyNoMatch')}</p>
                        <p className={styles.emptyText}>{t('tokenSelect.emptyTryAddress')}</p>
                    </div>
                ) : (
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
                )}
            </div>
        </Modal>
    );
};
