/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo } from 'react';
import type { FC } from 'react';
import { calcFiatValue } from '@ton/appkit';

import { Button } from '../../../../components/button';
import { CenteredAmountInput } from '../../../../components/centered-amount-input';
import { AmountPresets } from '../../../../components/amount-presets';
import type { AmountPreset } from '../../../../components/amount-presets';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../../components/tabs';
import { useI18n } from '../../../settings/hooks/use-i18n';
import { useConnect, useConnectors, useSelectedWallet } from '../../../wallets';
import { StakingInfo } from '../staking-info';
import styles from './staking-widget-ui.module.css';
import type { StakingContextType } from '../staking-widget-provider';
import { useBalance } from '../../../balances';

export type StakingWidgetRenderProps = StakingContextType;

export const StakingWidgetUI: FC<StakingWidgetRenderProps> = ({
    amount,
    fiatSymbol,
    canSubmit,
    isQuoteLoading,
    error,
    providerInfo,
    isProviderInfoLoading,
    setAmount,
    quote,
    tonRate,
    sendStakingTransaction,
    isSendingTransaction,
}) => {
    const connectors = useConnectors();
    const { mutate: connect, isPending: isConnecting } = useConnect();
    const [wallet] = useSelectedWallet();
    const isWalletConnected = wallet !== null;
    const { data: balance } = useBalance();

    const { t } = useI18n();

    const fiatValue = useMemo(() => {
        const parsedAmount = calcFiatValue(amount || '0', tonRate);
        return `${fiatSymbol}${parsedAmount}`;
    }, [amount, tonRate, fiatSymbol]);

    const presets: AmountPreset[] = useMemo(() => {
        const formattedBalance = balance ? parseFloat(balance.replace(/\s/g, '')) : 0;

        if (!formattedBalance) {
            return [
                { label: '10%', amount: '' },
                { label: '50%', amount: '' },
                { label: '75%', amount: '' },
                { label: t('staking.max'), amount: '' },
            ];
        }

        const calc = (percentage: number) => Number((formattedBalance * percentage).toFixed(4)).toString();

        return [
            { label: '10%', amount: calc(0.1) },
            { label: '50%', amount: calc(0.5) },
            { label: '75%', amount: calc(0.75) },
            { label: t('staking.max'), amount: balance ?? '' },
        ];
    }, [balance, t]);

    return (
        <div className={styles.widget}>
            <Tabs defaultValue="stake">
                <TabsList>
                    <TabsTrigger value="stake">{t('staking.stake')}</TabsTrigger>
                    <TabsTrigger value="unstake" disabled>
                        {t('staking.unstake')}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="stake">
                    <div className={styles.content}>
                        <div className={styles.inputSection}>
                            <CenteredAmountInput value={amount} onValueChange={setAmount} ticker="TON" />
                            {fiatValue && <span className={styles.fiatValue}>{fiatValue}</span>}
                        </div>

                        <AmountPresets presets={presets} onPresetSelect={setAmount} />

                        {isWalletConnected ? (
                            <Button
                                variant="fill"
                                size="l"
                                fullWidth
                                disabled={!canSubmit || isQuoteLoading || isSendingTransaction}
                                onClick={sendStakingTransaction}
                            >
                                {error
                                    ? t(`staking.${error}`)
                                    : canSubmit
                                      ? t('staking.continue')
                                      : t('staking.enterAmount')}
                            </Button>
                        ) : (
                            <Button
                                variant="fill"
                                size="l"
                                fullWidth
                                disabled={isConnecting || connectors.length === 0}
                                onClick={() => connectors[0] && connect({ connectorId: connectors[0].id })}
                            >
                                {t('wallet.connectWallet')}
                            </Button>
                        )}

                        <StakingInfo
                            quote={quote}
                            isQuoteLoading={isQuoteLoading}
                            providerInfo={providerInfo}
                            isProviderInfoLoading={isProviderInfoLoading}
                        />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};
