/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo } from 'react';
import type { FC } from 'react';
import { formatLargeValue } from '@ton/appkit';
import type { StakingQuote, StakingProviderInfo } from '@ton/appkit';

import { InfoBlock } from '../../../../components/info-block';
import { useI18n } from '../../../settings/hooks/use-i18n';

export interface StakingInfoProps {
    quote: StakingQuote | undefined;
    isQuoteLoading: boolean;
    providerInfo: StakingProviderInfo | undefined;
    isProviderInfoLoading: boolean;
}

export const StakingInfo: FC<StakingInfoProps> = ({ quote, isQuoteLoading, providerInfo, isProviderInfoLoading }) => {
    const { t } = useI18n();

    const formattedAmountToReceive = useMemo(() => {
        const parsedAmount = parseFloat(quote?.amountOut || '0');
        const trimmed = Number(parsedAmount.toFixed(5)).toString();

        return formatLargeValue(trimmed, 9);
    }, [quote?.amountOut]);

    // const exchangeRate = useMemo(() => {
    //     const parsedAmountIn = Number(quote?.amountIn || '0');
    //     const parsedAmountOut = Number(quote?.amountOut || '0');
    //     const rate = parsedAmountIn / parsedAmountOut;
    //     const trimmed = formatLargeValue(Number(rate.toFixed(5)).toString(), 9);

    //     return `1 TON = ${trimmed} TON`;
    // }, [quote?.amountIn, quote?.amountOut]);

    return (
        <InfoBlock.Container variant="outline">
            <InfoBlock.Row>
                <InfoBlock.Label>{t('staking.youGet')}</InfoBlock.Label>

                {isQuoteLoading ? (
                    <InfoBlock.ValueSkeleton />
                ) : (
                    <InfoBlock.Value>{formattedAmountToReceive}</InfoBlock.Value>
                )}
            </InfoBlock.Row>

            <InfoBlock.Row>
                <InfoBlock.Label>{t('staking.currentApy')}</InfoBlock.Label>

                {isProviderInfoLoading ? (
                    <InfoBlock.ValueSkeleton />
                ) : (
                    <InfoBlock.Value>
                        {providerInfo?.apy !== undefined ? `${providerInfo.apy.toFixed(2)}%` : '—'}
                    </InfoBlock.Value>
                )}
            </InfoBlock.Row>

            {/* <InfoBlock.Row>
                <InfoBlock.Label>{t('staking.exchangeRate')}</InfoBlock.Label>

                {isQuoteLoading ? <InfoBlock.ValueSkeleton /> : <InfoBlock.Value>{exchangeRate}</InfoBlock.Value>}
            </InfoBlock.Row> */}
        </InfoBlock.Container>
    );
};
