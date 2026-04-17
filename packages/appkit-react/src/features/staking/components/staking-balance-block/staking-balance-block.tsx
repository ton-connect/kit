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
import { TonIconCircle } from '../../../../components/ton-icon';
import { Button } from '../../../../components/button';
import { Skeleton } from '../../../../components/skeleton';
import styles from './staking-balance-block.module.css';
import { Logo } from '../../../../components/logo';
import { useJettonInfo } from '../../../jettons';

export interface StakingBalanceBlockProps extends ComponentProps<'div'> {
    providerMetadata: StakingProviderMetadata | undefined;
    direction: StakingQuoteDirection;
    stakedBalance?: string;
    isStakedBalanceLoading?: boolean;
    balance?: string;
    isBalanceLoading?: boolean;
    onMaxClick?: () => void;
}

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

    const displayBalance = direction === 'stake' ? balance : stakedBalance;
    const isDisplayLoading = direction === 'stake' ? isBalanceLoading : isStakedBalanceLoading;
    const ticker = direction === 'stake' ? providerMetadata?.stakeToken.ticker : providerMetadata?.receiveToken?.ticker;
    const decimals =
        direction === 'stake' ? providerMetadata?.stakeToken.decimals : providerMetadata?.receiveToken?.decimals;

    return (
        <div className={clsx(styles.container, className)} {...props}>
            <div className={styles.iconContainer}>
                {isNativeTon ? <TonIconCircle size={36} /> : <Logo size={36} src={jettonInfo?.image} />}
            </div>

            <div className={styles.info}>
                <div className={styles.label}>
                    {direction === 'stake' ? t('staking.yourBalance') : t('staking.stakedBalance')}
                </div>
                <div className={styles.value}>
                    {isDisplayLoading ? (
                        <Skeleton className={styles.skeleton} />
                    ) : (
                        <span>
                            {displayBalance && decimals ? formatLargeValue(displayBalance, Math.min(decimals, 4)) : '0'}{' '}
                            {ticker}
                        </span>
                    )}
                </div>
            </div>

            {onMaxClick && (
                <Button size="s" variant="secondary" className={styles.maxButton} onClick={onMaxClick}>
                    {t('staking.max')}
                </Button>
            )}
        </div>
    );
};
