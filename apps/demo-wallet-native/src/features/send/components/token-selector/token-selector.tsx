/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Ionicons } from '@expo/vector-icons';
import type { Jetton } from '@ton/walletkit';
import type { FC } from 'react';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useFormattedTonBalance, useJettons } from '@demo/wallet-core';

import { ActiveTouchAction } from '@/core/components/active-touch-action';
import { AppText } from '@/core/components/app-text';
import { Block } from '@/core/components/block';
import { CircleLogo } from '@/core/components/circle-logo';
import { TextAmount } from '@/core/components/text-amount';
import { getFormattedJettonInfo } from '@/core/utils/jetton';
import { logoSource } from '@/core/components/app-logo';

interface SelectedToken {
    type: 'TON' | 'JETTON';
    data?: Jetton;
}

interface TokenSelectorProps {
    onSelectToken: () => void;
    selectedToken: SelectedToken;
}

export const TokenSelector: FC<TokenSelectorProps> = ({ onSelectToken, selectedToken }) => {
    const { userJettons } = useJettons();
    const tonBalance = useFormattedTonBalance();

    const { theme } = useUnistyles();

    const getTokenInfo = () => {
        if (selectedToken.type === 'TON') {
            return {
                name: 'TON',
                symbol: 'TON',
                balance: tonBalance || '0',
                decimals: 9,
                image: logoSource,
            };
        }

        if (selectedToken.data) {
            const jettonInfo = getFormattedJettonInfo(selectedToken.data);

            return {
                name: jettonInfo.name || jettonInfo.symbol,
                symbol: jettonInfo.symbol,
                balance: jettonInfo.balance,
                decimals: jettonInfo.decimals,
                image: jettonInfo.image ? { uri: jettonInfo.image } : null,
            };
        }

        return null;
    };

    const tokenInfo = getTokenInfo();

    if (!tokenInfo) return null;

    const hasMultipleTokens = userJettons.length > 0;

    return (
        <Block>
            <ActiveTouchAction disabled={!hasMultipleTokens} onPress={onSelectToken} style={styles.selector}>
                <View style={styles.tokenInfo}>
                    {tokenInfo.image ? (
                        <CircleLogo.Container>
                            <CircleLogo.Logo source={tokenInfo.image} />
                        </CircleLogo.Container>
                    ) : (
                        <View style={styles.tonLogo}>
                            <AppText style={styles.tonLogoText}>{tokenInfo.symbol?.[0]}</AppText>
                        </View>
                    )}

                    <View style={styles.tokenDetails}>
                        <AppText style={styles.tokenName}>{tokenInfo.name}</AppText>
                        <View style={styles.balanceRow}>
                            <AppText style={styles.balanceLabel} textType="caption1">
                                Balance:{' '}
                            </AppText>
                            <TextAmount
                                amount={tokenInfo.balance}
                                decimals={tokenInfo.decimals}
                                style={styles.balanceValue}
                                textType="caption1"
                            />
                            <AppText style={styles.balanceSymbol} textType="caption1">
                                {' '}
                                {tokenInfo.symbol}
                            </AppText>
                        </View>
                    </View>
                </View>

                {hasMultipleTokens && <Ionicons color={theme.colors.text.secondary} name="chevron-down" size={20} />}
            </ActiveTouchAction>
        </Block>
    );
};

const styles = StyleSheet.create(({ sizes, colors }) => ({
    label: {
        color: colors.text.secondary,
        marginBottom: sizes.space.vertical / 2,
    },
    selector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: sizes.space.vertical / 2,
    },
    tokenInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: sizes.space.horizontal / 2,
        flex: 1,
    },
    tonLogo: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.accent.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tonLogoText: {
        color: colors.text.inverted,
    },
    tokenDetails: {
        flex: 1,
    },
    tokenName: {
        color: colors.text.highlight,
    },
    balanceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    balanceLabel: {
        color: colors.text.secondary,
    },
    balanceValue: {
        color: colors.text.secondary,
    },
    balanceSymbol: {
        color: colors.text.secondary,
    },
}));
