/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC, ComponentProps } from 'react';
import { calcFiatValue, formatLargeValue } from '@ton/appkit';
import clsx from 'clsx';

import { useI18n } from '../../../settings/hooks/use-i18n';
import { Input } from '../../../../components/ui/input/input';
import { Skeleton } from '../../../../components/ui/skeleton';
import { TokenSelector } from '../../../../components/shared/token-selector';
import type { AppkitUIToken } from '../../../../types/appkit-ui-token';
import { getDisplayAmount } from '../../utils/get-display-amount';
import styles from './swap-field.module.css';

export interface SwapFieldProps extends Omit<ComponentProps<typeof Input.Container>, 'children'> {
    type: 'pay' | 'receive';
    amount: string;
    fiatSymbol?: string;
    token?: AppkitUIToken;
    onAmountChange?: (value: string) => void;
    balance?: string;
    isBalanceLoading?: boolean;
    loading?: boolean;
    onMaxClick?: () => void;
    onTokenSelectorClick?: () => void;
    isWalletConnected?: boolean;
}

export const SwapField: FC<SwapFieldProps> = ({
    type,
    token,
    amount,
    onAmountChange,
    balance,
    isBalanceLoading,
    loading,
    onMaxClick,
    onTokenSelectorClick,
    isWalletConnected,
    fiatSymbol = '$',
    className,
    ...props
}) => {
    const { t } = useI18n();

    const tokenSymbol = token?.symbol;
    const displayBalance = getDisplayAmount(balance, token?.decimals);

    return (
        <Input.Container
            className={clsx(styles.container, className)}
            size="l"
            variant="unstyled"
            loading={loading}
            resizable
            {...props}
        >
            <Input.Header className={styles.header}>
                <Input.Title className={styles.title}>{type === 'pay' ? t('swap.pay') : t('swap.receive')}</Input.Title>
            </Input.Header>

            <Input.Field className={styles.field}>
                <Input.Input
                    placeholder="0"
                    value={amount}
                    onChange={onAmountChange && ((e) => onAmountChange(e.target.value))}
                    disabled={type === 'receive'}
                />
                <Input.Slot side="right">
                    <TokenSelector title={tokenSymbol ?? ''} icon={token?.logo} onClick={onTokenSelectorClick} />
                </Input.Slot>
            </Input.Field>

            <Input.Caption className={styles.caption}>
                <div className={styles.balanceLine}>
                    <span>
                        {token?.rate &&
                            `${fiatSymbol} ${formatLargeValue(calcFiatValue(amount || '0', token.rate), 2, 2)}`}
                    </span>
                    {type === 'pay' && token && (
                        <span className={styles.balanceWrapper}>
                            {isBalanceLoading ? (
                                <Skeleton className={styles.skeletonText} />
                            ) : (
                                <>
                                    <button className={styles.maxButton} onClick={onMaxClick} type="button">
                                        <span className={styles.max}>{t('swap.max')}</span> {displayBalance}{' '}
                                        {tokenSymbol}
                                    </button>
                                </>
                            )}
                        </span>
                    )}

                    {type === 'receive' && token && (
                        <span className={styles.balanceWrapper}>
                            {isBalanceLoading ? (
                                <Skeleton className={styles.skeletonText} />
                            ) : (
                                `${displayBalance} ${tokenSymbol}`
                            )}
                        </span>
                    )}
                </div>
            </Input.Caption>
        </Input.Container>
    );
};
