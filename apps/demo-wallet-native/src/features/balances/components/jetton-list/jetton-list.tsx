/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useJettons, loadUserJettons } from '@demo/core';
import { useEffect } from 'react';
import type { FC } from 'react';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';

import { AppText } from '@/core/components/app-text';
import { Block } from '@/core/components/block';
import { CircleLogo } from '@/core/components/circle-logo';
import { TextAmount } from '@/core/components/text-amount';
import { LoaderCircle } from '@/core/components/loader-circle';
import { RowCenter } from '@/core/components/grid';
import { getFormattedJettonInfo } from '@/core/utils/jetton';

export const JettonList: FC = () => {
    const { userJettons, isLoadingJettons, error } = useJettons();
    const { theme } = useUnistyles();

    // Load jettons on mount if none are loaded
    useEffect(() => {
        loadUserJettons();
    }, [loadUserJettons]);

    // Error state
    if (error) {
        return (
            <View style={styles.container}>
                <AppText style={styles.sectionTitle} textType="h3">
                    Jettons
                </AppText>
                <Block style={styles.errorBlock}>
                    <Ionicons color={theme.colors.error.default} name="alert-circle" size={32} />
                    <AppText style={styles.errorTitle}>Error loading jettons</AppText>
                    <AppText style={styles.errorText}>{error}</AppText>
                </Block>
            </View>
        );
    }

    // Loading state
    if (isLoadingJettons && userJettons.length === 0) {
        return (
            <View style={styles.container}>
                <AppText style={styles.sectionTitle} textType="h3">
                    Jettons
                </AppText>
                <Block>
                    <RowCenter style={styles.loadingContainer}>
                        <LoaderCircle size={32} />
                        <AppText style={styles.loadingText}>Loading jettons...</AppText>
                    </RowCenter>
                </Block>
            </View>
        );
    }

    // Empty state
    if (!userJettons || userJettons.length === 0) {
        return (
            <View style={styles.container}>
                <AppText style={styles.sectionTitle} textType="h3">
                    Jettons
                </AppText>

                <Block style={styles.emptyBlock}>
                    <AppText textType="caption1" style={styles.emptySubtitle}>
                        Your jetton tokens will appear here when you receive them
                    </AppText>
                </Block>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <AppText style={styles.sectionTitle} textType="h3">
                Jettons
            </AppText>

            {userJettons.map((jetton) => {
                const { image, name, symbol, decimals, balance } = getFormattedJettonInfo(jetton);
                const isVerified = false;

                return (
                    <Block key={jetton.address} style={styles.jettonItem}>
                        <View style={styles.jettonInfo}>
                            {image ? (
                                <CircleLogo.Container>
                                    <CircleLogo.Logo source={{ uri: image }} />
                                </CircleLogo.Container>
                            ) : (
                                <View style={styles.jettonImagePlaceholder}>
                                    <AppText style={styles.jettonImagePlaceholderText}>{symbol?.slice(0, 2)}</AppText>
                                </View>
                            )}

                            <View style={styles.jettonDetails}>
                                <View style={styles.jettonNameRow}>
                                    <AppText style={styles.jettonName}>{name}</AppText>
                                    {isVerified && (
                                        <Ionicons
                                            color={theme.colors.success.default}
                                            name="checkmark-circle"
                                            size={14}
                                        />
                                    )}
                                </View>
                                <AppText style={styles.jettonSymbol}>{symbol}</AppText>
                            </View>
                        </View>

                        <View style={styles.jettonBalance}>
                            <TextAmount style={styles.jettonBalanceAmount} amount={balance} decimals={decimals} />
                            <AppText style={styles.jettonBalanceSymbol}>{symbol}</AppText>
                        </View>
                    </Block>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create(({ sizes, colors }) => ({
    container: {
        gap: sizes.space.vertical,
    },
    sectionTitle: {
        color: colors.text.highlight,
        textAlign: 'center',
    },
    // Error state
    errorBlock: {
        alignItems: 'center',
        paddingVertical: sizes.space.vertical * 3,
        gap: sizes.space.vertical,
    },
    errorTitle: {
        color: colors.error.foreground,
        fontSize: 16,
        fontWeight: '600',
    },
    errorText: {
        color: colors.text.secondary,
        textAlign: 'center',
        fontSize: 14,
    },
    // Loading state
    loadingContainer: {
        paddingVertical: sizes.space.vertical * 2,
        gap: sizes.space.horizontal,
    },
    loadingText: {
        color: colors.text.secondary,
    },
    // Empty state
    emptyBlock: {
        alignItems: 'center',
        paddingVertical: sizes.space.vertical * 3,
        gap: sizes.space.vertical / 2,
    },
    emptyTitle: {
        color: colors.text.highlight,
    },
    emptySubtitle: {
        color: colors.text.secondary,
        textAlign: 'center',
        maxWidth: '80%',
    },
    // Jetton item
    jettonItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: sizes.space.vertical * 2,
    },
    jettonInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: sizes.space.horizontal / 2,
        flex: 1,
    },
    jettonImagePlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.navigation.default,
        justifyContent: 'center',
        alignItems: 'center',
    },
    jettonImagePlaceholderText: {
        color: colors.text.highlight,
    },
    jettonDetails: {
        flex: 1,
        gap: sizes.space.vertical / 4,
    },
    jettonNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: sizes.space.horizontal / 4,
    },
    jettonName: {
        color: colors.text.highlight,
        fontSize: 16,
        fontWeight: '500',
    },
    jettonSymbol: {
        color: colors.text.secondary,
        fontSize: 12,
    },
    jettonBalance: {
        alignItems: 'flex-end',
        gap: sizes.space.vertical / 4,
    },
    jettonBalanceAmount: {
        color: colors.text.highlight,
        fontSize: 16,
        fontWeight: '600',
    },
    jettonBalanceSymbol: {
        color: colors.text.secondary,
        fontSize: 12,
    },
}));
