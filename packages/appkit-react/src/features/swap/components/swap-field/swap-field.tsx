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

/**
 * Props accepted by {@link SwapField} — a single source/target row inside the swap widget that hosts the amount input, token picker trigger, fiat conversion and balance line.
 *
 * @public
 * @category Type
 * @section Swap
 */
export interface SwapFieldProps extends Omit<ComponentProps<typeof Input.Container>, 'children'> {
    /** `pay` renders the editable source row with a "max" shortcut. `receive` renders the read-only target row. */
    type: 'pay' | 'receive';
    /** Current amount shown in the input as a human-readable decimal string. */
    amount: string;
    /** Fiat currency symbol displayed in front of the converted value. Defaults to `"$"`. */
    fiatSymbol?: string;
    /** Currently selected token. Controls the token selector label, balance formatting and fiat conversion. */
    token?: AppkitUIToken;
    /** Called with the raw input value when the user edits the amount. Only fired for `type: "pay"`. */
    onAmountChange?: (value: string) => void;
    /** Formatted balance of `token` for the active wallet, as a human-readable decimal string. Rendered in the balance line beneath the input. */
    balance?: string;
    /** When true, the balance area renders a skeleton placeholder instead of the value. */
    isBalanceLoading?: boolean;
    /** When true, the underlying input renders its loading state — used while a fresh quote is in flight. */
    loading?: boolean;
    /** Called when the user clicks the "max" shortcut to fill the maximum spendable amount. */
    onMaxClick?: () => void;
    /** Called when the user clicks the token selector chip — typically opens a `SwapTokenSelectModal`. */
    onTokenSelectorClick?: () => void;
}

/**
 * One row of the swap form. Renders the amount input, fiat conversion, balance line, and a token-selector chip. The `pay` variant is editable and exposes a "max" shortcut. The `receive` variant is read-only and shows the quote result.
 *
 * @sample docs/examples/src/appkit/components/swap#SWAP_FIELD
 *
 * @public
 * @category Component
 * @section Swap
 */
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
