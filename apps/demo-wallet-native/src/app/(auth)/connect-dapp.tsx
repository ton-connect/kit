/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useTonConnect } from '@demo/core';
import { router } from 'expo-router';
import { useState, useCallback } from 'react';
import type { FC } from 'react';
import { View, Alert } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppButton } from '@/core/components/app-button';
import { AppKeyboardAwareScrollView } from '@/core/components/keyboard-aware-scroll-view';
import { AppText } from '@/core/components/app-text';
import { QrScanner } from '@/core/components/qr-scanner';
import { ScreenHeader } from '@/core/components/screen-header';
import { ScanQrButton, TonConnectLinkInput } from '@/features/ton-connect';

const ConnectDAppScreen: FC = () => {
    const { handleTonConnectUrl } = useTonConnect();
    const [tonConnectUrl, setTonConnectUrl] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);
    const [isScannerVisible, setIsScannerVisible] = useState(false);

    const handleConnect = useCallback(
        async (url: string) => {
            if (!url.trim()) return;

            setIsConnecting(true);
            try {
                await handleTonConnectUrl(url.trim());
                setTonConnectUrl('');
                router.back();
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error('Failed to connect to dApp:', error);
                Alert.alert('Connection Failed', 'Failed to connect to the dApp. Please check the URL and try again.');
            } finally {
                setIsConnecting(false);
            }
        },
        [handleTonConnectUrl],
    );

    const handleScannerClose = useCallback(() => {
        setIsScannerVisible(false);
    }, []);

    const handleScannerOpen = useCallback(() => {
        setIsScannerVisible(true);
    }, []);

    const handleScan = useCallback(
        async (data: string) => {
            try {
                await handleTonConnectUrl(data.trim());
                handleScannerClose();
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
        [handleTonConnectUrl, handleScannerClose],
    );

    return (
        <AppKeyboardAwareScrollView contentContainerStyle={styles.containerContent} style={styles.container}>
            <ScreenHeader.Container>
                <ScreenHeader.LeftSide>
                    <ScreenHeader.BackButton />
                </ScreenHeader.LeftSide>
                <ScreenHeader.Title>Connect to dApp</ScreenHeader.Title>
            </ScreenHeader.Container>

            <View style={styles.content}>
                <AppText style={styles.description} textType="body1">
                    Scan a QR code or paste a TON Connect link to connect to a dApp
                </AppText>

                <ScanQrButton onPress={handleScannerOpen} />

                <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <AppText style={styles.dividerText} textType="caption1">
                        or
                    </AppText>
                    <View style={styles.dividerLine} />
                </View>

                <TonConnectLinkInput value={tonConnectUrl} onChangeText={setTonConnectUrl} />

                <AppButton.Container
                    onPress={() => handleConnect(tonConnectUrl)}
                    disabled={!tonConnectUrl.trim() || isConnecting}
                    style={styles.connectButton}
                >
                    <AppButton.Text>{isConnecting ? 'Connecting...' : 'Connect'}</AppButton.Text>
                </AppButton.Container>
            </View>
            <QrScanner isVisible={isScannerVisible} onClose={handleScannerClose} onScan={handleScan} />
        </AppKeyboardAwareScrollView>
    );
};

export default ConnectDAppScreen;

const styles = StyleSheet.create(({ sizes, colors }, runtime) => ({
    container: {
        marginTop: runtime.insets.top,
        marginLeft: runtime.insets.left,
        marginRight: runtime.insets.right,
        paddingHorizontal: sizes.page.paddingHorizontal,
    },
    containerContent: {
        paddingTop: sizes.page.paddingTop,
        paddingBottom: runtime.insets.bottom + sizes.page.paddingBottom,
    },
    content: {
        gap: sizes.space.vertical,
        marginTop: sizes.space.vertical,
    },
    description: {
        color: colors.text.secondary,
        textAlign: 'center',
        marginBottom: sizes.space.vertical,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: sizes.space.horizontal,
        paddingVertical: sizes.space.vertical,
        paddingHorizontal: sizes.space.horizontal / 2,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: colors.border.default,
    },
    dividerText: {
        color: colors.text.secondary,
    },
    connectButton: {
        marginTop: sizes.space.vertical / 2,
    },
}));
