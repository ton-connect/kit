/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';
import { calcFiatValue, formatLargeValue } from '@ton/appkit';

import { useI18n } from '../../../settings/hooks/use-i18n';
import { Input } from '../../../../components/input/input';
import { Skeleton } from '../../../../components/skeleton';
import { TokenSelector } from '../token-selector/token-selector';
import type { AppkitUIToken } from '../../../../types/appkit-ui-token';
import { useSwapContext } from '../swap-widget-provider/swap-widget-provider';
import styles from './swap-field.module.css';

export interface SwapFieldProps {
    type: 'pay' | 'receive';
    amount: string;
    token?: AppkitUIToken;
    onAmountChange?: (value: string) => void;
    balance?: string;
    loading?: boolean;
    onMaxClick?: () => void;
    onTokenSelectorClick?: () => void;
}

export const SwapField: FC<SwapFieldProps> = ({
    type,
    token,
    amount,
    onAmountChange,
    balance,
    loading,
    onMaxClick,
    onTokenSelectorClick,
}) => {
    const { t } = useI18n();
    const { fiatSymbol } = useSwapContext();

    const tokenSymbol = token?.symbol || '';
    const displayDecimals = token ? Math.min(token.decimals, 5) : 5;

    return (
        <Input.Container size="l" variant="unstyled" className={styles.container} loading={loading} resizable>
            <Input.Header className={styles.header}>
                <Input.Title>{type === 'pay' ? t('swap.pay') : t('swap.receive')}</Input.Title>
            </Input.Header>

            <Input.Field style={{ minHeight: 'var(--ta-input-l-line-height)' }}>
                <Input.Input
                    placeholder="0"
                    value={amount}
                    onChange={onAmountChange && ((e) => onAmountChange(e.target.value))}
                    disabled={type === 'receive'}
                />
                <Input.Slot side="right">
                    <TokenSelector symbol={tokenSymbol} icon={token?.logo} onClick={onTokenSelectorClick} />
                </Input.Slot>
            </Input.Field>

            <Input.Caption className={styles.caption}>
                <div className={styles.balanceLine}>
                    <span>
                        {token?.rate &&
                            `${fiatSymbol} ${formatLargeValue(calcFiatValue(amount || '0', token.rate), 2)}`}
                    </span>
                    {type === 'pay' && (
                        <span className={styles.balanceWrapper}>
                            {balance ? (
                                <>
                                    {t('swap.max')}
                                    <button className={styles.maxButton} onClick={onMaxClick} type="button">
                                        {formatLargeValue(balance, displayDecimals)} {tokenSymbol}
                                    </button>
                                </>
                            ) : (
                                <Skeleton className={styles.skeletonText} />
                            )}
                        </span>
                    )}

                    {type === 'receive' && (
                        <span className={styles.balanceWrapper}>
                            {balance ? (
                                `${formatLargeValue(balance, displayDecimals)} ${tokenSymbol}`
                            ) : (
                                <Skeleton className={styles.skeletonText} />
                            )}
                        </span>
                    )}
                </div>
            </Input.Caption>
        </Input.Container>
    );
};
