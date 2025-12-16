/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Network } from '@ton/walletkit';
import type { JettonInfo } from '@ton/walletkit';
import { Address } from '@ton/core';
import { useState, useEffect, memo } from 'react';
import type { FC } from 'react';
import { View, Image } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import type { ITonWalletKit } from '@ton/walletkit';
import type { SavedWallet } from '@ton/demo-core';

import { AppText } from '@/core/components/app-text';
import { Block } from '@/core/components/block';
import { fromMinorUnit } from '@/core/utils/amount/minor-unit';
import { TextAmount } from '@/core/components/text-amount';

function safeParseAddress(address: string): string | null {
    try {
        return Address.parse(address).toString();
    } catch {
        return null;
    }
}

interface JettonFlowItemProps {
    jettonAddress: Address | string | undefined;
    amount: string;
    activeWallet: SavedWallet;
    walletKit: ITonWalletKit;
}

export const JettonFlowItem: FC<JettonFlowItemProps> = memo(({ jettonAddress, amount, activeWallet, walletKit }) => {
    const [jettonInfo, setJettonInfo] = useState<JettonInfo | null>(null);

    const resolvedAddress =
        jettonAddress && typeof jettonAddress === 'string' && jettonAddress !== 'TON'
            ? safeParseAddress(jettonAddress)
            : jettonAddress;

    const network = activeWallet?.network || 'testnet';
    const chainNetwork = network === 'mainnet' ? Network.mainnet() : Network.testnet();

    useEffect(() => {
        if (!resolvedAddress) {
            setJettonInfo(null);

            return;
        }

        const updateJettonInfo = async () => {
            if (!resolvedAddress) return;

            const jettonInfo = await walletKit?.jettons?.getJettonInfo(resolvedAddress.toString(), chainNetwork);
            setJettonInfo(jettonInfo ?? null);
        };

        void updateJettonInfo();
    }, [resolvedAddress, walletKit, chainNetwork]);

    const isPositive = BigInt(amount) >= 0n;
    const decimals = jettonInfo?.decimals ?? 9;
    const formattedAmount = fromMinorUnit(amount, decimals).toString();
    const displayAmount = isPositive ? `+${formattedAmount}` : formattedAmount;
    const symbol = jettonInfo?.symbol ?? (jettonAddress === 'TON' ? 'TON' : 'UNKWN');
    const name = jettonInfo?.name ?? jettonAddress?.toString() ?? 'Unknown';

    return (
        <Block style={styles.container}>
            <View style={styles.left}>
                {jettonInfo?.image ? (
                    <Image source={{ uri: jettonInfo.image }} style={styles.image} />
                ) : (
                    <View style={styles.imagePlaceholder}>
                        <AppText style={styles.placeholderText} textType="caption1">
                            {symbol[0] || '?'}
                        </AppText>
                    </View>
                )}

                <AppText style={styles.name} textType="body1" numberOfLines={1}>
                    {name}
                </AppText>
            </View>

            <TextAmount
                style={[styles.amount, isPositive ? styles.positive : styles.negative]}
                textType="body1"
                amount={displayAmount}
                tokenCode={symbol}
                isSymbolShown={isPositive}
                symbol="+"
            />
        </Block>
    );
});

const styles = StyleSheet.create(({ colors, sizes }) => ({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: sizes.space.horizontal / 2,
    },
    left: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: sizes.space.horizontal / 2,
        flex: 1,
    },
    image: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    imagePlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.background.main,
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderText: {
        color: colors.text.secondary,
    },
    name: {
        color: colors.text.highlight,
        flex: 1,
    },
    amount: {
        fontWeight: '600',
        marginLeft: sizes.space.horizontal / 2,
    },
    positive: {
        color: colors.status.success,
    },
    negative: {
        color: colors.status.error,
    },
}));
