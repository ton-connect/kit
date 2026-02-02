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

import type { LedgerDevice } from '../../utils/ledger-transport';
import { DeviceList } from '../device-list';
import { ScanningIndicator } from '../scanning-indicator';

import { AppText } from '@/core/components/app-text';
import { AppButton } from '@/core/components/app-button';

interface Props {
    isScanning: boolean;
    devices: LedgerDevice[];
    connectingDeviceId?: string;
    error: string | null;
    onDeviceSelect: (device: LedgerDevice) => void;
    onStopScan: () => void;
    onStartScan: () => void;
}

export const ScanningStep: FC<Props> = ({
    isScanning,
    devices,
    connectingDeviceId,
    error,
    onDeviceSelect,
    onStopScan,
    onStartScan,
}) => {
    return (
        <>
            <ScanningIndicator isScanning={isScanning} />
            <DeviceList devices={devices} onDevicePress={onDeviceSelect} connectingDeviceId={connectingDeviceId} />
            {error && <AppText style={styles.errorText}>{error}</AppText>}
            <View style={styles.buttonContainer}>
                <AppButton.Container colorScheme="secondary" onPress={isScanning ? onStopScan : onStartScan}>
                    <AppButton.Text>{isScanning ? 'Stop Scanning' : 'Scan Again'}</AppButton.Text>
                </AppButton.Container>
            </View>
        </>
    );
};

const styles = StyleSheet.create(({ sizes, colors }) => ({
    buttonContainer: {
        marginTop: sizes.space.vertical,
    },
    errorText: {
        color: colors.error.default,
        textAlign: 'center',
        fontSize: 14,
    },
}));
