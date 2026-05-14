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

import { InfoBlock } from '../../../../components/ui/info-block';
import { useI18n } from '../../../settings/hooks/use-i18n';
import { formatAmount } from './utils';

/**
 * Props accepted by {@link StakingInfo}.
 *
 * @public
 * @category Type
 * @section Staking
 */
export interface StakingInfoProps extends ComponentProps<typeof InfoBlock.Container> {
    /** Current staking quote — its `amountOut` is rendered in the "You get" row. */
    quote: StakingQuote | undefined;
    /** True while the quote is being fetched. Swaps the "You get" value for a skeleton. */
    isQuoteLoading: boolean;
    /** Dynamic provider info — supplies APY and exchange rate. */
    providerInfo: StakingProviderInfo | undefined;
    /** Static provider metadata — supplies token tickers/decimals and the provider name. */
    providerMetadata: StakingProviderMetadata | undefined;
    /** True while provider info is being fetched. */
    isProviderInfoLoading: boolean;
    /** Operation direction — controls which token's decimals/ticker label the "You get" amount. Defaults to `'stake'`. */
    direction?: StakingQuoteDirection;
}

/**
 * Summary block rendered below the staking input. Shows the amount the user will receive, the provider's current APY, the stake-token to receive-token exchange rate (only when the provider has a receive token), and the provider name. The exchange-rate row always reads as `1 stakeToken = X receiveToken`, regardless of `direction`.
 *
 * @public
 * @category Component
 * @section Staking
 */
export const StakingInfo: FC<StakingInfoProps> = ({
    quote,
    isQuoteLoading,
    providerInfo,
    providerMetadata,
    isProviderInfoLoading,
    direction = 'stake',
    ...props
}) => {
    const { t } = useI18n();

    const receiveToken = providerMetadata?.receiveToken;
    const stakeToken = providerMetadata?.stakeToken;

    const youGetDecimals = direction === 'stake' ? receiveToken?.decimals : stakeToken?.decimals;
    const youGetTicker = direction === 'stake' ? receiveToken?.ticker : stakeToken?.ticker;

    return (
        <InfoBlock.Container {...props}>
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
                <InfoBlock.Label>{t('staking.currentApy')}</InfoBlock.Label>

                {isProviderInfoLoading ? (
                    <InfoBlock.ValueSkeleton />
                ) : (
                    <InfoBlock.Value>
                        {providerInfo?.apy !== undefined ? `${formatAmount(providerInfo.apy.toString(), 2)}%` : '—'}
                    </InfoBlock.Value>
                )}
            </InfoBlock.Row>

            {receiveToken && (
                <InfoBlock.Row>
                    <InfoBlock.Label>{t('staking.exchangeRate')}</InfoBlock.Label>

                    {isProviderInfoLoading ? (
                        <InfoBlock.ValueSkeleton />
                    ) : (
                        <InfoBlock.Value>
                            1 {stakeToken?.ticker} = {formatAmount(providerInfo?.exchangeRate, receiveToken.decimals)}{' '}
                            {receiveToken.ticker}
                        </InfoBlock.Value>
                    )}
                </InfoBlock.Row>
            )}

            <InfoBlock.Row>
                <InfoBlock.Label>{t('staking.provider')}</InfoBlock.Label>

                {providerMetadata?.name ? (
                    <InfoBlock.Value>{providerMetadata.name}</InfoBlock.Value>
                ) : (
                    <InfoBlock.ValueSkeleton />
                )}
            </InfoBlock.Row>
        </InfoBlock.Container>
    );
};
