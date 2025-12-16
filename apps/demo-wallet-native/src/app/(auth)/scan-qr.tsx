/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useTonConnect } from '@ton/demo-core';
import { router } from 'expo-router';
import { useCallback } from 'react';
import type { FC } from 'react';
import { View, Alert } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { ScreenHeader } from '@/core/components/screen-header';
import { QrScanner } from '@/features/ton-connect';

const ScanQrScreen: FC = () => {
    const { handleTonConnectUrl } = useTonConnect();

    const handleScan = useCallback(
        async (data: string) => {
            try {
                await handleTonConnectUrl(data.trim());
                router.back();
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error('Failed to connect to dApp:', error);
                Alert.alert(
                    'Connection Failed',
                    'Failed to connect to the dApp. Please check the QR code and try again.',
                );
            }
        },
        [handleTonConnectUrl],
    );

    const handleCancel = useCallback(() => {
        router.back();
    }, []);

    return (
        <View style={styles.container}>
            <ScreenHeader.Container>
                <ScreenHeader.LeftSide>
                    <ScreenHeader.BackButton />
                </ScreenHeader.LeftSide>
                <ScreenHeader.Title>Scan QR Code</ScreenHeader.Title>
            </ScreenHeader.Container>

            <View style={styles.content}>
                <QrScanner onScan={handleScan} onCancel={handleCancel} />
            </View>
        </View>
    );
};

export default ScanQrScreen;

const styles = StyleSheet.create(({ sizes }, runtime) => ({
    container: {
        flex: 1,
        marginTop: runtime.insets.top,
        marginLeft: runtime.insets.left,
        marginRight: runtime.insets.right,
        paddingHorizontal: sizes.page.paddingHorizontal,
        paddingTop: sizes.page.paddingTop,
        paddingBottom: runtime.insets.bottom + sizes.page.paddingBottom,
    },
    content: {
        flex: 1,
        marginTop: sizes.space.vertical,
    },
}));
