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

import type { LedgerDevice } from '../utils/ledger-transport';

import { ActiveTouchAction } from '@/core/components/active-touch-action';
import { AppText } from '@/core/components/app-text';
import { Block } from '@/core/components/block';
import { LoaderCircle } from '@/core/components/loader-circle';

interface DeviceListItemProps {
    device: LedgerDevice;
    onPress: (device: LedgerDevice) => void;
    isConnecting?: boolean;
}

export const DeviceListItem: FC<DeviceListItemProps> = ({ device, onPress, isConnecting }) => {
    const { theme } = useUnistyles();

    return (
        <ActiveTouchAction onPress={() => onPress(device)} disabled={isConnecting}>
            <Block style={[styles.container, isConnecting && styles.connecting]}>
                <View style={[styles.iconContainer, { backgroundColor: theme.colors.accent.secondary }]}>
                    <Ionicons name="hardware-chip-outline" size={24} color={theme.colors.accent.primary} />
                </View>

                <View style={styles.content}>
                    <AppText style={styles.name} textType="body1">
                        {device.name}
                    </AppText>
                    <AppText style={styles.id} textType="caption1">
                        {device.id.slice(0, 17)}...
                    </AppText>
                </View>

                {!isConnecting && <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />}

                {isConnecting && <LoaderCircle size={20} color={theme.colors.text.secondary} />}
            </Block>
        </ActiveTouchAction>
    );
};

const styles = StyleSheet.create(({ colors, sizes }) => ({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: sizes.space.horizontal,
    },
    connecting: {
        opacity: 0.6,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: sizes.borderRadius.rounded,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        gap: 2,
    },
    name: {
        color: colors.text.highlight,
    },
    id: {
        color: colors.text.secondary,
    },
}));
