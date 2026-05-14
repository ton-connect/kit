/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';

import styles from './token-selector.module.css';
import { Button } from '../../../../components/ui/button';
import { ChevronDownIcon } from '../../../../components/ui/icons';
import { Logo } from '../../../../components/ui/logo';
import { useI18n } from '../../../settings/hooks/use-i18n';

export interface TokenSelectorProps {
    symbol?: string;
    icon?: string;
    onClick?: () => void;
}

export const TokenSelector: FC<TokenSelectorProps> = ({ symbol, icon, onClick }) => {
    const { t } = useI18n();
    const label = symbol ?? t('swap.selectToken');
    const fallback = symbol?.[0] ?? '?';

    return (
        <Button className={styles.tokenSelector} onClick={onClick} variant="gray" size="s">
            {symbol && <Logo size={24} src={icon} fallback={fallback} alt={symbol} />}
            <span style={{ lineHeight: '24px' }}>{label}</span>
            <ChevronDownIcon size={16} className={styles.chevron} />
        </Button>
    );
};
