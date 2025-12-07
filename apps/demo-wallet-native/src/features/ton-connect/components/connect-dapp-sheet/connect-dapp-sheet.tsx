/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Clipboard from 'expo-clipboard';
import { useTonConnect } from '@ton/demo-core';
import { type FC, useState, useCallback } from 'react';
import { View, Alert, Linking } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { ActiveTouchAction } from '@/core/components/active-touch-action';
import { AppBottomSheet } from '@/core/components/app-bottom-sheet';
import { AppButton } from '@/core/components/app-button';
import { AppText } from '@/core/components/app-text';
import { Block } from '@/core/components/block';
import { BottomSheetInput } from '@/core/components/bottom-sheet-input';

interface ConnectDAppSheetProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ConnectDAppSheet: FC<ConnectDAppSheetProps> = ({ isOpen, onClose }) => {
    const { theme } = useUnistyles();
    const { handleTonConnectUrl } = useTonConnect();
    const [permission, requestPermission] = useCameraPermissions();
    const [showScanner, setShowScanner] = useState(false);
    const [tonConnectUrl, setTonConnectUrl] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);
    const [scanned, setScanned] = useState(false);

    const handleConnect = useCallback(
        async (url: string) => {
            if (!url.trim()) return;

            setIsConnecting(true);
            try {
                await handleTonConnectUrl(url.trim());
                setTonConnectUrl('');
                onClose();
            } catch (error) {
                console.error('Failed to connect to dApp:', error);
                Alert.alert('Connection Failed', 'Failed to connect to the dApp. Please check the URL and try again.');
            } finally {
                setIsConnecting(false);
            }
        },
        [handleTonConnectUrl, onClose],
    );

    const handleBarCodeScanned = useCallback(
        ({ data }: { data: string }) => {
            if (scanned) return;
            setScanned(true);
            setShowScanner(false);
            handleConnect(data);
        },
        [scanned, handleConnect],
    );

    const handleOpenScanner = useCallback(async () => {
        if (!permission?.granted) {
            const result = await requestPermission();
            if (!result.granted) {
                Alert.alert('Camera Permission Required', 'Please grant camera permission to scan QR codes.', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Open Settings', onPress: () => Linking.openSettings() },
                ]);
                return;
            }
        }
        setScanned(false);
        setShowScanner(true);
    }, [permission, requestPermission]);

    const handlePasteFromClipboard = useCallback(async () => {
        try {
            const text = await Clipboard.getStringAsync();
            if (text) {
                setTonConnectUrl(text);
            }
        } catch (error) {
            console.error('Failed to paste from clipboard:', error);
        }
    }, []);

    const handleCloseSheet = useCallback(() => {
        setShowScanner(false);
        setTonConnectUrl('');
        setScanned(false);
        onClose();
    }, [onClose]);

    return (
        <AppBottomSheet isOpened={isOpen} onClose={handleCloseSheet} title="Connect to dApp">
            <View style={styles.container}>
                {showScanner ? (
                    <View style={styles.scannerContainer}>
                        <CameraView
                            style={styles.camera}
                            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                            onBarcodeScanned={handleBarCodeScanned}
                        />
                        <View style={styles.scannerOverlay}>
                            <View style={styles.scannerFrame} />
                        </View>

                        <AppText style={styles.scannerHint} textType="body1">
                            Point your camera at a TON Connect QR code
                        </AppText>

                        <AppButton.Container
                            colorScheme="secondary"
                            onPress={() => setShowScanner(false)}
                            style={styles.cancelButton}
                        >
                            <AppButton.Text>Cancel</AppButton.Text>
                        </AppButton.Container>
                    </View>
                ) : (
                    <>
                        <AppText style={styles.description} textType="body1">
                            Scan a QR code or paste a TON Connect link to connect to a dApp
                        </AppText>

                        <ActiveTouchAction onPress={handleOpenScanner} style={styles.scanButton}>
                            <Block style={styles.scanButtonContent}>
                                <View style={styles.scanIcon}>
                                    <Ionicons name="qr-code-outline" size={32} color={theme.colors.accent.primary} />
                                </View>

                                <View style={styles.scanTextContainer}>
                                    <AppText style={styles.scanTitle} textType="h5">
                                        Scan QR Code
                                    </AppText>
                                    <AppText style={styles.scanSubtitle} textType="caption1">
                                        Use camera to scan TON Connect QR
                                    </AppText>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
                            </Block>
                        </ActiveTouchAction>

                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />

                            <AppText style={styles.dividerText} textType="caption1">
                                or
                            </AppText>

                            <View style={styles.dividerLine} />
                        </View>

                        <View style={styles.inputSection}>
                            <AppText style={styles.inputLabel} textType="caption1">
                                Paste TON Connect Link
                            </AppText>

                            <View style={styles.inputContainer}>
                                <BottomSheetInput
                                    style={styles.input}
                                    placeholder="tc://... or ton://... or https://..."
                                    placeholderTextColor={theme.colors.text.secondary}
                                    value={tonConnectUrl}
                                    onChangeText={setTonConnectUrl}
                                    multiline
                                    numberOfLines={3}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />

                                <ActiveTouchAction onPress={handlePasteFromClipboard} style={styles.pasteButton}>
                                    <Ionicons name="clipboard-outline" size={20} color={theme.colors.accent.primary} />
                                </ActiveTouchAction>
                            </View>
                        </View>

                        <AppButton.Container
                            onPress={() => handleConnect(tonConnectUrl)}
                            disabled={!tonConnectUrl.trim() || isConnecting}
                            style={styles.connectButton}
                        >
                            <AppButton.Text>{isConnecting ? 'Connecting...' : 'Connect'}</AppButton.Text>
                        </AppButton.Container>
                    </>
                )}
            </View>
        </AppBottomSheet>
    );
};

const styles = StyleSheet.create(({ colors, sizes }) => ({
    container: {
        gap: sizes.space.vertical,
        paddingBottom: sizes.space.vertical,
    },
    description: {
        color: colors.text.secondary,
        textAlign: 'center',
        marginBottom: sizes.space.vertical * 2,
    },
    scanButton: {
        backgroundColor: colors.background.secondary,
        borderRadius: 12,
        padding: sizes.space.vertical,
    },
    scanButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: sizes.space.vertical,
        paddingHorizontal: sizes.space.horizontal / 4,
    },
    scanIcon: {
        width: 56,
        height: 56,
        borderRadius: 12,
        backgroundColor: colors.accent.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: sizes.space.horizontal / 1.5,
    },
    scanTextContainer: {
        flex: 1,
        gap: 2,
        marginRight: sizes.space.horizontal / 2,
    },
    scanTitle: {
        color: colors.text.highlight,
    },
    scanSubtitle: {
        color: colors.text.secondary,
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
    inputSection: {
        gap: sizes.space.vertical / 2,
    },
    inputLabel: {
        color: colors.text.highlight,
        textAlign: 'center',
        marginBottom: sizes.space.vertical / 2,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: colors.background.secondary,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border.default,
    },
    input: {
        flex: 1,
        padding: sizes.space.vertical,
        paddingHorizontal: sizes.space.horizontal / 2,
        color: colors.text.default,
        fontSize: 14,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    pasteButton: {
        paddingVertical: sizes.space.vertical,
        paddingHorizontal: sizes.space.horizontal / 2,
    },
    connectButton: {
        marginTop: sizes.space.vertical / 2,
    },
    scannerContainer: {
        gap: sizes.space.vertical,
    },
    camera: {
        height: 300,
        borderRadius: 12,
        overflow: 'hidden',
    },
    scannerOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scannerFrame: {
        width: 200,
        height: 200,
        borderWidth: 2,
        borderColor: colors.accent.primary,
        borderRadius: 12,
    },
    scannerHint: {
        color: colors.text.secondary,
        textAlign: 'center',
    },
    cancelButton: {
        marginTop: sizes.space.vertical / 2,
    },
}));
