/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ComponentProps, FC } from 'react';
import type { StakingQuoteDirection } from '@ton/appkit';
import type { StakingProviderMetadata } from '@ton/appkit';
import clsx from 'clsx';
import { formatLargeValue } from '@ton/appkit';

import { useI18n } from '../../../settings/hooks/use-i18n';
import { TonIconCircle } from '../../../../components/ui/icons';
import { Button } from '../../../../components/ui/button';
import { Skeleton } from '../../../../components/ui/skeleton';
import styles from './staking-balance-block.module.css';
import { Logo } from '../../../../components/ui/logo';
import { useJettonInfo } from '../../../jettons';

/**
 * Props accepted by {@link StakingBalanceBlock}.
 *
 * @public
 * @category Type
 * @section Staking
 */
export interface StakingBalanceBlockProps extends ComponentProps<'div'> {
    /** Provider metadata — supplies the stake/receive tokens (address, ticker, decimals). */
    providerMetadata: StakingProviderMetadata | undefined;
    /** Operation direction; selects which token and balance to render. */
    direction: StakingQuoteDirection;
    /** User's currently staked amount, used when `direction === 'unstake'`. */
    stakedBalance?: string;
    /** True while the staked balance is being fetched. */
    isStakedBalanceLoading?: boolean;
    /** User's wallet balance of the stake token, used when `direction === 'stake'`. */
    balance?: string;
    /** True while the wallet balance is being fetched. */
    isBalanceLoading?: boolean;
    /** When provided, renders a `MAX` button that invokes this callback. */
    onMaxClick?: () => void;
}

/**
 * Row showing the user's relevant balance for the current direction: wallet balance of the stake token when staking, staked balance when unstaking. Renders a token icon (native TON when the token address is `'ton'`, otherwise a jetton icon resolved via {@link useJettonInfo}), a label, the formatted amount with ticker, and an optional `MAX` button.
 *
 * @sample docs/examples/src/appkit/components/staking#STAKING_BALANCE_BLOCK
 *
 * @public
 * @category Component
 * @section Staking
 */
export const StakingBalanceBlock: FC<StakingBalanceBlockProps> = ({
    providerMetadata,
    direction,
    stakedBalance,
    isStakedBalanceLoading,
    balance,
    isBalanceLoading,
    onMaxClick,
    className,
    ...props
}) => {
    const tokenAddress =
        direction === 'stake' ? providerMetadata?.stakeToken.address : providerMetadata?.receiveToken?.address;
    const isNativeTon = tokenAddress === 'ton';

    const { data: jettonInfo } = useJettonInfo({
        address: tokenAddress,
        query: { enabled: !isNativeTon && !!tokenAddress },
    });

    const { t } = useI18n();

    // Token icon, ticker and decimals all come from `providerMetadata`. Until it
    // resolves, render the row as a loading skeleton instead of a broken icon
    // and a ticker-less zero.
    const isMetadataReady = providerMetadata !== undefined;
    const displayBalance = direction === 'stake' ? balance : stakedBalance;
    const isDisplayLoading = direction === 'stake' ? isBalanceLoading : isStakedBalanceLoading;
    const ticker = direction === 'stake' ? providerMetadata?.stakeToken.ticker : providerMetadata?.receiveToken?.ticker;
    const decimals =
        direction === 'stake' ? providerMetadata?.stakeToken.decimals : providerMetadata?.receiveToken?.decimals;
    const showValueSkeleton = !isMetadataReady || isDisplayLoading;

    return (
        <div className={clsx(styles.container, className)} {...props}>
            <div className={styles.iconContainer}>
                {!isMetadataReady ? (
                    <Skeleton width={36} height={36} />
                ) : isNativeTon ? (
                    <TonIconCircle size={36} />
                ) : (
                    <Logo size={36} src={jettonInfo?.image} />
                )}
            </div>

            <div className={styles.info}>
                <div className={styles.label}>
                    {direction === 'stake' ? t('staking.yourBalance') : t('staking.stakedBalance')}
                </div>
                <div className={styles.value}>
                    {showValueSkeleton ? (
                        <Skeleton className={styles.skeleton} />
                    ) : (
                        <span>
                            {displayBalance && decimals ? formatLargeValue(displayBalance, Math.min(decimals, 4)) : '0'}{' '}
                            {ticker}
                        </span>
                    )}
                </div>
            </div>

            {onMaxClick && isMetadataReady && (
                <Button size="s" variant="secondary" className={styles.maxButton} onClick={onMaxClick}>
                    {t('staking.max')}
                </Button>
            )}
        </div>
    );
};
