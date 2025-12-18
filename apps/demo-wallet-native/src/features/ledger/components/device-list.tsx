/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import type { LedgerDevice } from '../utils/ledger-transport';
import { DeviceListItem } from './device-list-item';

import { AppText } from '@/core/components/app-text';

interface DeviceListProps {
    devices: LedgerDevice[];
    onDevicePress: (device: LedgerDevice) => void;
    connectingDeviceId?: string;
}

export const DeviceList: FC<DeviceListProps> = ({ devices, onDevicePress, connectingDeviceId }) => {
    if (devices.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <AppText style={styles.emptyText}>No devices found yet...</AppText>
                <AppText style={styles.emptyHint}>Make sure your Ledger is unlocked and Bluetooth is enabled</AppText>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <AppText style={styles.title}>Found Devices</AppText>
            <View style={styles.list}>
                {devices.map((device) => (
                    <DeviceListItem
                        key={device.id}
                        device={device}
                        onPress={onDevicePress}
                        isConnecting={connectingDeviceId === device.id}
                    />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create(({ colors, sizes }) => ({
    container: {
        gap: sizes.space.vertical,
    },
    title: {
        color: colors.text.highlight,
        fontWeight: '500',
        fontSize: 14,
    },
    list: {
        gap: sizes.space.vertical,
    },
    emptyContainer: {
        alignItems: 'center',
        padding: sizes.space.vertical * 2,
        gap: sizes.space.vertical / 2,
    },
    emptyText: {
        color: colors.text.secondary,
        textAlign: 'center',
    },
    emptyHint: {
        color: colors.text.secondary,
        textAlign: 'center',
        fontSize: 12,
        opacity: 0.7,
    },
}));
