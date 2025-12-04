/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Ionicons } from '@expo/vector-icons';
import type { FC } from 'react';
import { ScrollView, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useJettons, useWallet } from '@ton/demo-core';
import type { AddressJetton } from '@ton/walletkit';

import { ActiveTouchAction } from '@/core/components/active-touch-action';
import { AppLogo } from '@/core/components/app-logo';
import { AppModal } from '@/core/components/app-modal';
import { AppText } from '@/core/components/app-text';
import { CircleLogo } from '@/core/components/circle-logo';
import { TextAmount } from '@/core/components/text-amount';

interface SelectedToken {
    type: 'TON' | 'JETTON';
    data?: AddressJetton;
}

interface TokenListSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectTon: () => void;
    onSelectJetton: (jetton: AddressJetton) => void;
    selectedToken: SelectedToken;
}

export const TokenListSheet: FC<TokenListSheetProps> = ({ isOpen, onClose, onSelectTon, onSelectJetton }) => {
    const { balance: tonBalance } = useWallet();
    const { userJettons } = useJettons();

    const { theme } = useUnistyles();

    const handleSelectTon = () => {
        onSelectTon();
        onClose();
    };

    const handleSelectJetton = (jetton: AddressJetton) => {
        onSelectJetton(jetton);
        onClose();
    };

    return (
        <AppModal onRequestClose={onClose} visible={isOpen}>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
                <View style={styles.header}>
                    <AppText style={styles.title} textType="h3">
                        Select
                    </AppText>

                    <ActiveTouchAction onPress={onClose} style={styles.closeButton}>
                        <Ionicons color={theme.colors.text.default} name="close-outline" size={24} />
                    </ActiveTouchAction>
                </View>

                <ActiveTouchAction onPress={handleSelectTon} style={styles.tokenItem}>
                    <View style={styles.tokenInfo}>
                        <AppLogo />
                        <View style={styles.tokenDetails}>
                            <AppText style={styles.tokenName}>TON</AppText>
                            <AppText style={styles.tokenDescription} textType="caption1">
                                The Open Network
                            </AppText>
                        </View>
                    </View>

                    <View style={styles.tokenBalance}>
                        <TextAmount amount={tonBalance || '0'} decimals={9} style={styles.balanceAmount} />
                        <AppText style={styles.balanceSymbol} textType="caption1">
                            TON
                        </AppText>
                    </View>
                </ActiveTouchAction>

                {userJettons.map((jetton) => (
                    <ActiveTouchAction
                        key={jetton.address}
                        onPress={() => handleSelectJetton(jetton)}
                        style={styles.tokenItem}
                    >
                        <View style={styles.tokenInfo}>
                            {jetton.image ? (
                                <CircleLogo.Container>
                                    <CircleLogo.Logo source={{ uri: jetton.image }} />
                                </CircleLogo.Container>
                            ) : (
                                <View style={styles.jettonPlaceholder}>
                                    <AppText style={styles.jettonPlaceholderText}>{jetton.symbol.charAt(0)}</AppText>
                                </View>
                            )}
                            <View style={styles.tokenDetails}>
                                <AppText style={styles.tokenName}>{jetton.name}</AppText>
                                <AppText style={styles.tokenDescription} textType="caption1">
                                    {jetton.symbol}
                                </AppText>
                            </View>
                        </View>
                        <View style={styles.tokenBalance}>
                            <TextAmount
                                amount={jetton.balance}
                                decimals={jetton.decimals}
                                style={styles.balanceAmount}
                            />
                            <AppText style={styles.balanceSymbol} textType="caption1">
                                {jetton.symbol}
                            </AppText>
                        </View>
                    </ActiveTouchAction>
                ))}
            </ScrollView>
        </AppModal>
    );
};

const styles = StyleSheet.create(({ sizes, colors }, runtime) => ({
    container: {
        paddingHorizontal: sizes.page.paddingHorizontal,
        paddingVertical: sizes.block.paddingVertical,
        marginBottom: runtime.insets.bottom * 2,
    },
    header: {
        position: 'relative',
        marginTop: 10,
        marginBottom: 20,
    },
    title: {
        color: colors.text.highlight,
        textAlign: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 0,
        right: 12,
    },
    tokenItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: sizes.space.vertical * 2,
        paddingHorizontal: sizes.space.horizontal / 1.5,
        borderRadius: sizes.borderRadius.md,
        backgroundColor: colors.background.block,
        marginBottom: sizes.space.vertical,
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
    jettonPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.navigation.default,
        justifyContent: 'center',
        alignItems: 'center',
    },
    jettonPlaceholderText: {
        color: colors.text.highlight,
    },
    tokenDetails: {
        flex: 1,
    },
    tokenName: {
        color: colors.text.highlight,
    },
    tokenDescription: {
        color: colors.text.secondary,
    },
    tokenBalance: {
        alignItems: 'flex-end',
    },
    balanceAmount: {
        color: colors.text.highlight,
    },
    balanceSymbol: {
        color: colors.text.secondary,
    },
}));
