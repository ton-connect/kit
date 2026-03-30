/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC, ReactNode } from 'react';

import { useI18n } from '../../../settings/hooks/use-i18n';
import { Input } from '../../../../components/input/input';
import { TokenSelector } from '../token-selector/token-selector';
import styles from './swap-field.module.css';

export interface SwapFieldProps {
    type: 'pay' | 'receive';
    tokenSymbol: string;
    tokenIcon: ReactNode;
    amount: string;
    onAmountChange?: (value: string) => void;
    usdValue?: string;
    balance?: string;
    onMaxClick?: () => void;
    onTokenSelectorClick?: () => void;
}

export const SwapField: FC<SwapFieldProps> = ({
    type,
    tokenSymbol,
    tokenIcon,
    amount,
    onAmountChange,
    usdValue,
    balance,
    onMaxClick,
    onTokenSelectorClick,
}) => {
    const { t } = useI18n();

    return (
        <Input.Container size="l" variant="unstyled" className={styles.container}>
            <Input.Header className={styles.header}>
                <Input.Title>{type === 'pay' ? t('swap.pay') : t('swap.receive')}</Input.Title>
            </Input.Header>

            <Input.Field>
                <Input.Input
                    placeholder="0"
                    value={amount}
                    onChange={onAmountChange && ((e) => onAmountChange(e.target.value))}
                    disabled={type === 'receive'}
                />
                <Input.Slot side="right">
                    <TokenSelector symbol={tokenSymbol} icon={tokenIcon} onClick={onTokenSelectorClick} />
                </Input.Slot>
            </Input.Field>

            <Input.Caption className={styles.caption}>
                <div className={styles.balanceLine}>
                    <span>{usdValue ? `$ ${usdValue}` : '$ 0.00'}</span>
                    {type === 'pay' && balance && (
                        <span>
                            {t('swap.max')}{' '}
                            <button className={styles.maxButton} onClick={onMaxClick} type="button">
                                {balance} {tokenSymbol}
                            </button>
                        </span>
                    )}

                    {type === 'receive' && balance && (
                        <span>
                            {balance} {tokenSymbol}
                        </span>
                    )}
                </div>
            </Input.Caption>
        </Input.Container>
    );
};
