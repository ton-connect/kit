/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ComponentProps, FC } from 'react';
import type { StakingQuote, StakingProviderInfo, StakingQuoteDirection } from '@ton/appkit';
import type { StakingProviderMetadata } from '@ton/appkit';

import { InfoBlock } from '../../../../components/info-block';
import { useI18n } from '../../../settings/hooks/use-i18n';
import { formatAmount } from './utils';

export interface StakingInfoProps extends ComponentProps<typeof InfoBlock.Container> {
    quote: StakingQuote | undefined;
    isQuoteLoading: boolean;
    providerInfo: StakingProviderInfo | undefined;
    providerMetadata: StakingProviderMetadata | undefined;
    isProviderInfoLoading: boolean;
    direction?: StakingQuoteDirection;
    stakedBalance?: string;
    isStakedBalanceLoading?: boolean;
}

export const StakingInfo: FC<StakingInfoProps> = ({
    quote,
    isQuoteLoading,
    providerInfo,
    providerMetadata,
    isProviderInfoLoading,
    direction = 'stake',
    stakedBalance,
    isStakedBalanceLoading,
    ...props
}) => {
    const { t } = useI18n();

    const youGetDecimals = direction === 'stake' ? providerMetadata?.lstDecimals : providerMetadata?.stakeTokenDecimals;
    const youGetTicker = direction === 'stake' ? providerMetadata?.lstTicker : providerMetadata?.stakeTokenTicker;

    return (
        <InfoBlock.Container variant="outline" {...props}>
            <InfoBlock.Row>
                <InfoBlock.Label>{t('staking.youGet')}</InfoBlock.Label>

                {isQuoteLoading || isProviderInfoLoading ? (
                    <InfoBlock.ValueSkeleton />
                ) : (
                    <InfoBlock.Value>
                        {formatAmount(quote?.amountOut, youGetDecimals)} {youGetTicker}
                    </InfoBlock.Value>
                )}
            </InfoBlock.Row>

            <InfoBlock.Row>
                <InfoBlock.Label>{t('staking.stakedBalance')}</InfoBlock.Label>

                {isStakedBalanceLoading && !stakedBalance ? (
                    <InfoBlock.ValueSkeleton />
                ) : (
                    <InfoBlock.Value>
                        {formatAmount(stakedBalance, providerMetadata?.lstDecimals)} {providerMetadata?.lstTicker}
                    </InfoBlock.Value>
                )}
            </InfoBlock.Row>

            <InfoBlock.Row>
                <InfoBlock.Label>{t('staking.currentApy')}</InfoBlock.Label>

                {isProviderInfoLoading ? (
                    <InfoBlock.ValueSkeleton />
                ) : (
                    <InfoBlock.Value>
                        {providerInfo?.apy !== undefined ? `${formatAmount(providerInfo.apy.toString(), 2)}%` : '—'}
                    </InfoBlock.Value>
                )}
            </InfoBlock.Row>

            <InfoBlock.Row>
                <InfoBlock.Label>{t('staking.exchangeRate')}</InfoBlock.Label>

                {isProviderInfoLoading ? (
                    <InfoBlock.ValueSkeleton />
                ) : (
                    <InfoBlock.Value>
                        1 {providerMetadata?.stakeTokenTicker} ={' '}
                        {formatAmount(providerInfo?.lstExchangeRate, providerMetadata?.lstDecimals)}{' '}
                        {providerMetadata?.lstTicker}
                    </InfoBlock.Value>
                )}
            </InfoBlock.Row>
        </InfoBlock.Container>
    );
};
