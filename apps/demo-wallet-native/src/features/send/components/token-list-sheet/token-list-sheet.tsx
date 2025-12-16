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
import { useFormattedTonBalance, useJettons } from '@ton/demo-core';
import type { Jetton } from '@ton/walletkit';

import { ActiveTouchAction } from '@/core/components/active-touch-action';
import { AppLogo } from '@/core/components/app-logo';
import { AppModal } from '@/core/components/app-modal';
import { AppText } from '@/core/components/app-text';
import { CircleLogo } from '@/core/components/circle-logo';
import { TextAmount } from '@/core/components/text-amount';
import { getFormattedJettonInfo } from '@/core/utils/jetton';

interface SelectedToken {
    type: 'TON' | 'JETTON';
    data?: Jetton;
}

interface TokenListSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectTon: () => void;
    onSelectJetton: (jetton: Jetton) => void;
    selectedToken: SelectedToken;
}

export const TokenListSheet: FC<TokenListSheetProps> = ({ isOpen, onClose, onSelectTon, onSelectJetton }) => {
    const { userJettons } = useJettons();
    const tonBalance = useFormattedTonBalance();

    const { theme } = useUnistyles();

    const handleSelectTon = () => {
        onSelectTon();
        onClose();
    };

    const handleSelectJetton = (jetton: Jetton) => {
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

                {userJettons.map((jetton) => {
                    const { image, name, symbol, decimals, balance, address } = getFormattedJettonInfo(jetton);

                    return (
                        <ActiveTouchAction
                            key={address}
                            onPress={() => handleSelectJetton(jetton)}
                            style={styles.tokenItem}
                        >
                            <View style={styles.tokenInfo}>
                                {image ? (
                                    <CircleLogo.Container>
                                        <CircleLogo.Logo source={{ uri: image }} />
                                    </CircleLogo.Container>
                                ) : (
                                    <View style={styles.jettonPlaceholder}>
                                        <AppText style={styles.jettonPlaceholderText}>{symbol?.charAt(0)}</AppText>
                                    </View>
                                )}
                                <View style={styles.tokenDetails}>
                                    <AppText style={styles.tokenName}>{name}</AppText>
                                    <AppText style={styles.tokenDescription} textType="caption1">
                                        {symbol}
                                    </AppText>
                                </View>
                            </View>

                            <View style={styles.tokenBalance}>
                                <TextAmount amount={balance} decimals={decimals} style={styles.balanceAmount} />
                                <AppText style={styles.balanceSymbol} textType="caption1">
                                    {symbol}
                                </AppText>
                            </View>
                        </ActiveTouchAction>
                    );
                })}
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
