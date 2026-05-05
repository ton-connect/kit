/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';

import { InfoBlock } from '../../../../../components/info-block';
import type { CryptoOnrampToken } from '../../../types';
import { useI18n } from '../../../../settings/hooks/use-i18n';
import { formatOnrampAmount } from '../utils/format-onramp-amount';

export interface CryptoOnrampInfoBlockProps {
    selectedToken: CryptoOnrampToken | null;
    /** Amount of the target token the user will receive (already resolved from input/converted). */
    tokenAmount: string;
    isLoadingQuote: boolean;
    isWalletConnected: boolean;
    targetBalance: string;
    isLoadingTargetBalance: boolean;
    quoteProviderName: string | null;
    className?: string;
}

export const CryptoOnrampInfoBlock: FC<CryptoOnrampInfoBlockProps> = ({
    selectedToken,
    tokenAmount,
    isLoadingQuote,
    isWalletConnected,
    targetBalance,
    isLoadingTargetBalance,
    quoteProviderName,
    className,
}) => {
    const { t } = useI18n();

    return (
        <InfoBlock.Container className={className}>
            <InfoBlock.Row>
                <InfoBlock.Label>{t('cryptoOnramp.youGet')}</InfoBlock.Label>

                {isLoadingQuote ? (
                    <InfoBlock.ValueSkeleton />
                ) : (
                    <InfoBlock.Value>
                        {formatOnrampAmount(tokenAmount, selectedToken?.decimals)} {selectedToken?.symbol}
                    </InfoBlock.Value>
                )}
            </InfoBlock.Row>

            {isWalletConnected && (
                <InfoBlock.Row>
                    <InfoBlock.Label>{t('cryptoOnramp.yourBalance')}</InfoBlock.Label>

                    {isLoadingTargetBalance ? (
                        <InfoBlock.ValueSkeleton />
                    ) : (
                        <InfoBlock.Value>
                            {formatOnrampAmount(targetBalance || '0', selectedToken?.decimals)} {selectedToken?.symbol}
                        </InfoBlock.Value>
                    )}
                </InfoBlock.Row>
            )}

            <InfoBlock.Row>
                <InfoBlock.Label>{t('cryptoOnramp.provider')}</InfoBlock.Label>
                {isLoadingQuote || !quoteProviderName ? (
                    <InfoBlock.ValueSkeleton />
                ) : (
                    <InfoBlock.Value>{quoteProviderName}</InfoBlock.Value>
                )}
            </InfoBlock.Row>
        </InfoBlock.Container>
    );
};
