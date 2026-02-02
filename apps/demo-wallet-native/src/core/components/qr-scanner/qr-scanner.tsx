/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useCallback, useRef, useEffect } from 'react';
import type { FC } from 'react';
import { View, Alert, Linking, Modal } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/core/components/app-text';
import { AppButton } from '@/core/components/app-button';

interface QrScannerProps {
    isVisible: boolean;
    onScan: (data: string) => void | Promise<void>;
    onClose: () => void;
    hint?: string;
}

export const QrScanner: FC<QrScannerProps> = ({
    isVisible,
    onScan,
    onClose,
    hint = 'Point your camera at a TON Connect QR code',
}) => {
    const [permission, requestPermission] = useCameraPermissions();
    const [isReady, setIsReady] = useState(false);
    const scanLockRef = useRef(false);

    const resetScanner = useCallback(() => {
        scanLockRef.current = false;
        setIsReady(false);
    }, []);

    useEffect(() => {
        if (!isVisible) {
            resetScanner();
        }
    }, [isVisible, resetScanner]);

    const handleBarCodeScanned = useCallback(
        ({ data }: { data: string }) => {
            if (scanLockRef.current) return;

            scanLockRef.current = true;

            Promise.resolve(onScan(data)).catch(() => {
                scanLockRef.current = false;
            });
        },
        [onScan],
    );

    const handleRequestPermission = useCallback(async () => {
        const result = await requestPermission();
        if (!result.granted) {
            Alert.alert('Camera Permission Required', 'Please grant camera permission to scan QR codes.', [
                { text: 'Cancel', style: 'cancel', onPress: onClose },
                { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]);
        } else {
            setIsReady(true);
        }
    }, [requestPermission, onClose]);

    useEffect(() => {
        if (!isVisible) return;

        if (permission?.granted) {
            setIsReady(true);
        } else {
            void handleRequestPermission();
        }
    }, [isVisible, permission?.granted, handleRequestPermission]);

    if (!isVisible) {
        return null;
    }

    const canShowCamera = permission?.granted && isReady;

    return (
        <Modal
            animationType="fade"
            transparent={false}
            visible={isVisible}
            presentationStyle="fullScreen"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <View style={styles.wrapper}>
                {canShowCamera && (
                    <CameraView
                        style={styles.camera}
                        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                        onBarcodeScanned={handleBarCodeScanned}
                    />
                )}

                <View style={styles.overlay}>
                    <View style={styles.center}>
                        <View style={styles.frame} />
                        <AppText style={styles.hint} textType="body1">
                            {hint}
                        </AppText>
                    </View>

                    <View style={styles.bottom}>
                        <AppButton.Container colorScheme="secondary" onPress={onClose} style={styles.closeButton}>
                            <AppButton.Text>Cancel</AppButton.Text>
                        </AppButton.Container>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create(({ colors, sizes }, runtime) => ({
    wrapper: {
        flex: 1,
        backgroundColor: colors.background.main,
    },
    camera: {
        ...StyleSheet.absoluteFillObject,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        marginHorizontal: sizes.page.paddingHorizontal,
        paddingBottom: runtime.insets.bottom + sizes.page.paddingBottom,
    },
    closeButton: {
        minWidth: 120,
    },
    center: {
        position: 'absolute',
        top: '50%',
        width: '100%',
        transform: [{ translateY: '-50%' }],
        gap: sizes.space.vertical,
        alignItems: 'center',
    },
    frame: {
        width: 260,
        height: 260,
        borderWidth: 3,
        borderColor: colors.accent.primary,
        borderRadius: 24,
        backgroundColor: 'rgba(0, 0, 0, 0.15)',
    },
    hint: {
        color: colors.white,
        textAlign: 'center',
    },
    bottom: {
        marginTop: 'auto',
    },
}));
