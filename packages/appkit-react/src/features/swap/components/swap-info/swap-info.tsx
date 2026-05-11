/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ComponentProps, FC } from 'react';
import type { SwapQuote, SwapProvider } from '@ton/appkit';

import { InfoBlock } from '../../../../components/ui/info-block';
import { useI18n } from '../../../settings/hooks/use-i18n';
import type { AppkitUIToken } from '../../../../types/appkit-ui-token';
import { getDisplayAmount } from '../../utils/get-display-amount';

/**
 * Props accepted by {@link SwapInfo} — the summary block under the swap form that surfaces minimum received, slippage and the chosen provider.
 *
 * @public
 * @category Type
 * @section Swap
 */
export interface SwapInfoProps extends ComponentProps<typeof InfoBlock.Container> {
    /** Target token the user is receiving; used to format `minReceived` with the right decimals and symbol. */
    toToken: AppkitUIToken | null;
    /** Slippage tolerance in basis points (`100` = 1%). Rendered as a percentage. */
    slippage: number;
    /** Current {@link SwapProvider}; its display name is shown in the provider row. */
    provider?: SwapProvider;
    /** Quote whose `minReceived` value is displayed; when undefined the value falls back to `0` (still suffixed with the token symbol). */
    quote?: SwapQuote;
    /** When true, the minimum-received value renders a skeleton placeholder instead of the formatted number. */
    isQuoteLoading?: boolean;
}

/**
 * Summary block rendered under the swap form. Shows the minimum amount the user is guaranteed to receive after slippage, the configured slippage tolerance, and the active {@link SwapProvider}.
 *
 * @public
 * @category Component
 * @section Swap
 */
export const SwapInfo: FC<SwapInfoProps> = ({ quote, provider, toToken, slippage, isQuoteLoading, ...props }) => {
    const { t } = useI18n();

    const minReceived = `${getDisplayAmount(quote?.minReceived, toToken?.decimals)} ${toToken?.symbol || ''}`;
    const providerName = provider?.getMetadata().name;
    const slippagePercent = `${(slippage / 100).toFixed(2)}%`;

    return (
        <InfoBlock.Container {...props}>
            <InfoBlock.Row>
                <InfoBlock.Label>{t('swap.minReceived')}</InfoBlock.Label>
                {isQuoteLoading ? <InfoBlock.ValueSkeleton /> : <InfoBlock.Value>{minReceived}</InfoBlock.Value>}
            </InfoBlock.Row>
            <InfoBlock.Row>
                <InfoBlock.Label>{t('swap.slippage')}</InfoBlock.Label>
                <InfoBlock.Value>{slippagePercent}</InfoBlock.Value>
            </InfoBlock.Row>
            <InfoBlock.Row>
                <InfoBlock.Label>{t('swap.provider')}</InfoBlock.Label>
                {providerName ? <InfoBlock.Value>{providerName}</InfoBlock.Value> : <InfoBlock.ValueSkeleton />}
            </InfoBlock.Row>
        </InfoBlock.Container>
    );
};
