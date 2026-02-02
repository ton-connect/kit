/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Ionicons } from '@expo/vector-icons';
import type { FC } from 'react';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { ActiveTouchAction } from '@/core/components/active-touch-action';
import { AppText } from '@/core/components/app-text';
import { Block } from '@/core/components/block';

interface ScanQrButtonProps {
    onPress: () => void;
    title?: string;
    subtitle?: string;
}

export const ScanQrButton: FC<ScanQrButtonProps> = ({
    onPress,
    title = 'Scan QR Code',
    subtitle = 'Use camera to scan TON Connect QR',
}) => {
    const { theme } = useUnistyles();

    return (
        <ActiveTouchAction onPress={onPress} style={styles.container}>
            <Block style={styles.content}>
                <View style={styles.icon}>
                    <Ionicons name="qr-code-outline" size={32} color={theme.colors.accent.primary} />
                </View>

                <View style={styles.textContainer}>
                    <AppText style={styles.title} textType="h5">
                        {title}
                    </AppText>
                    <AppText style={styles.subtitle} textType="caption1">
                        {subtitle}
                    </AppText>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
            </Block>
        </ActiveTouchAction>
    );
};

const styles = StyleSheet.create(({ colors, sizes }) => ({
    container: {
        backgroundColor: colors.background.secondary,
        borderRadius: 12,
        padding: sizes.space.vertical,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: sizes.space.vertical,
        paddingHorizontal: sizes.space.horizontal / 4,
    },
    icon: {
        width: 56,
        height: 56,
        borderRadius: 12,
        backgroundColor: colors.accent.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: sizes.space.horizontal / 1.5,
    },
    textContainer: {
        flex: 1,
        gap: 2,
        marginRight: sizes.space.horizontal / 2,
    },
    title: {
        color: colors.text.highlight,
    },
    subtitle: {
        color: colors.text.secondary,
    },
}));
