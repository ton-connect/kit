/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ComponentProps, FC } from 'react';
import type { SwapQuote, SwapProvider } from '@ton/appkit';
import { formatLargeValue } from '@ton/appkit';

import { InfoBlock } from '../../../../components/info-block';
import { useI18n } from '../../../settings/hooks/use-i18n';
import type { AppkitUIToken } from '../../../../types/appkit-ui-token';

export interface SwapInfoProps extends ComponentProps<typeof InfoBlock.Container> {
    toToken: AppkitUIToken | null;
    slippage: number;
    provider?: SwapProvider;
    quote?: SwapQuote;
    isQuoteLoading?: boolean;
}

export const SwapInfo: FC<SwapInfoProps> = ({ quote, provider, toToken, slippage, isQuoteLoading, ...props }) => {
    const { t } = useI18n();

    const minReceived = `${formatLargeValue(quote?.minReceived || '0', Math.min(toToken?.decimals || 6, 6))} ${toToken?.symbol}`;
    const providerName = provider?.getMetadata().name;
    const slippagePercent = `${(slippage / 100).toFixed(2)}%`;

    return (
        <InfoBlock.Container {...props}>
            <InfoBlock.Row>
                <InfoBlock.Label>{t('swap.minReceived')}</InfoBlock.Label>
                {isQuoteLoading ? <InfoBlock.ValueSkeleton /> : <InfoBlock.Value>{minReceived}</InfoBlock.Value>}
            </InfoBlock.Row>
            <InfoBlock.Row>
                <InfoBlock.Label>{t('swap.provider')}</InfoBlock.Label>
                {providerName ? <InfoBlock.Value>{providerName}</InfoBlock.Value> : <InfoBlock.ValueSkeleton />}
            </InfoBlock.Row>
            <InfoBlock.Row>
                <InfoBlock.Label>{t('swap.slippage')}</InfoBlock.Label>
                <InfoBlock.Value>{slippagePercent}</InfoBlock.Value>
            </InfoBlock.Row>
        </InfoBlock.Container>
    );
};
