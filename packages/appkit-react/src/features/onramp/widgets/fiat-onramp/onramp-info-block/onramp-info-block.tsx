/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';
import type { OnrampQuote } from '@ton/appkit/onramp';

import { InfoBlock } from '../../../../../components/info-block';
import type { AppkitUIToken } from '../../../../../types/appkit-ui-token';
import { useConnectedWallets } from '../../../../wallets/hooks/use-connected-wallets';
import { useI18n } from '../../../../settings/hooks/use-i18n';
import { formatOnrampAmount } from '../../crypto-onramp/utils/format-onramp-amount';
import { useOnrampBalance } from './use-onramp-balance';

export interface OnrampInfoBlockProps {
    selectedToken: AppkitUIToken | null;
    selectedQuote?: OnrampQuote;
    isLoading: boolean;
    className?: string;
}

export const OnrampInfoBlock: FC<OnrampInfoBlockProps> = ({ selectedToken, selectedQuote, isLoading, className }) => {
    const { t } = useI18n();

    const wallets = useConnectedWallets();
    const activeWallet = wallets?.[0];
    const isWalletConnected = !!activeWallet;
    const { targetBalance, isLoadingTargetBalance } = useOnrampBalance({
        selectedToken,
        userAddress: activeWallet?.getAddress(),
    });

    return (
        <InfoBlock.Container className={className}>
            <InfoBlock.Row>
                <InfoBlock.Label>{t('onramp.youGet')}</InfoBlock.Label>

                {isLoading ? (
                    <InfoBlock.ValueSkeleton />
                ) : (
                    <InfoBlock.Value>
                        {formatOnrampAmount(selectedQuote?.cryptoAmount, selectedToken?.decimals)}{' '}
                        {selectedToken?.symbol}
                    </InfoBlock.Value>
                )}
            </InfoBlock.Row>

            {isWalletConnected && (
                <InfoBlock.Row>
                    <InfoBlock.Label>{t('onramp.yourBalance')}</InfoBlock.Label>

                    {isLoadingTargetBalance ? (
                        <InfoBlock.ValueSkeleton />
                    ) : (
                        <InfoBlock.Value>
                            {formatOnrampAmount(targetBalance || '0', selectedToken?.decimals)} {selectedToken?.symbol}
                        </InfoBlock.Value>
                    )}
                </InfoBlock.Row>
            )}
        </InfoBlock.Container>
    );
};
