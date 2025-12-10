/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { CameraView, useCameraPermissions } from 'expo-camera';
import { type FC, useState, useCallback } from 'react';
import { View, Alert, Linking } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/core/components/app-text';

interface QrScannerProps {
    onScan: (data: string) => void;
    onCancel: () => void;
    hint?: string;
}

export const QrScanner: FC<QrScannerProps> = ({
    onScan,
    onCancel,
    hint = 'Point your camera at a TON Connect QR code',
}) => {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [isReady, setIsReady] = useState(false);

    const handleBarCodeScanned = useCallback(
        ({ data }: { data: string }) => {
            if (scanned) return;
            setScanned(true);
            onScan(data);
        },
        [scanned, onScan],
    );

    const handleRequestPermission = useCallback(async () => {
        const result = await requestPermission();
        if (!result.granted) {
            Alert.alert('Camera Permission Required', 'Please grant camera permission to scan QR codes.', [
                { text: 'Cancel', style: 'cancel', onPress: onCancel },
                { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]);
        } else {
            setIsReady(true);
        }
    }, [requestPermission, onCancel]);

    if (!permission?.granted && !isReady) {
        void handleRequestPermission();
    }

    return (
        <View style={styles.container}>
            <CameraView
                style={styles.camera}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={handleBarCodeScanned}
            />

            <AppText style={styles.hint} textType="body1">
                {hint}
            </AppText>
        </View>
    );
};

const styles = StyleSheet.create(({ colors, sizes }) => ({
    container: {
        gap: sizes.space.vertical,
    },
    camera: {
        aspectRatio: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    hint: {
        color: colors.text.secondary,
        textAlign: 'center',
    },
}));
