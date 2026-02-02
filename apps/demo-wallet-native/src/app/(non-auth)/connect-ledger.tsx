/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback, useState } from 'react';
import type { FC } from 'react';
import { Alert, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { router } from 'expo-router';
import { useAuth, useWallet } from '@demo/wallet-core';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AppText } from '@/core/components/app-text';
import { ScreenHeader } from '@/core/components/screen-header';
import { ScreenWrapper } from '@/core/components/screen-wrapper';
import { getErrorMessage } from '@/core/utils/errors/get-error-message';
import { useLedgerConnection, InstructionsStep, ScanningStep, ConfigureStep, ConnectingStep } from '@/features/ledger';
import type { LedgerDevice } from '@/features/ledger';

const LEDGER_DEVICE_ID_KEY = 'ledger_device_id';

type ScreenState = 'instructions' | 'scanning' | 'configure' | 'connecting';

const SUBTITLES: Record<ScreenState, string> = {
    instructions: 'Connect your Ledger hardware wallet via Bluetooth',
    scanning: 'Select your Ledger device from the list below',
    configure: 'Configure your wallet settings',
    connecting: 'Setting up your wallet',
};

const ConnectLedgerScreen: FC = () => {
    const [screenState, setScreenState] = useState<ScreenState>('instructions');
    const [selectedDevice, setSelectedDevice] = useState<LedgerDevice | null>(null);
    const [network, setNetwork] = useState<'mainnet' | 'testnet'>('testnet');
    const [accountNumber, setAccountNumber] = useState(0);

    const { setUseWalletInterfaceType, setLedgerAccountNumber } = useAuth();
    const { createLedgerWallet } = useWallet();

    const handleDeviceConnected = useCallback(async (device: LedgerDevice) => {
        await AsyncStorage.setItem(LEDGER_DEVICE_ID_KEY, device.id);
    }, []);

    const {
        status,
        devices,
        error: connectionError,
        startScan,
        stopScan,
        connect,
        disconnect,
    } = useLedgerConnection({
        onDeviceConnected: handleDeviceConnected,
    });

    const handleStartScan = useCallback(async () => {
        setScreenState('scanning');
        await startScan();
    }, [startScan]);

    const handleStopScan = useCallback(() => {
        stopScan();
        if (devices.length === 0) {
            setScreenState('instructions');
        }
    }, [stopScan, devices.length]);

    const handleDeviceSelect = useCallback(
        async (device: LedgerDevice) => {
            try {
                setSelectedDevice(device);
                await connect(device);
                setScreenState('configure');
            } catch (err) {
                Alert.alert('Connection Failed', getErrorMessage(err));
                setSelectedDevice(null);
            }
        },
        [connect],
    );

    const handleCreateWallet = useCallback(async () => {
        if (!selectedDevice) {
            Alert.alert('Error', 'No device selected');
            return;
        }

        try {
            setScreenState('connecting');

            setUseWalletInterfaceType('ledger');
            setLedgerAccountNumber(accountNumber);

            await disconnect();
            await new Promise((resolve) => setTimeout(resolve, 1000));
            await createLedgerWallet(undefined, network);

            router.replace('/(auth)/(tabs)/wallet');
        } catch (err) {
            const errorMessage = getErrorMessage(err);

            if (errorMessage.includes('0x6d02') || errorMessage.includes('UNKNOWN_APDU')) {
                Alert.alert(
                    'TON App Not Open',
                    'Please make sure the TON application is open on your Ledger device and try again.',
                );
            } else if (errorMessage.includes('0x6985') || errorMessage.includes('denied')) {
                Alert.alert('Action Cancelled', 'The action was cancelled on the Ledger device.');
            } else {
                Alert.alert('Error', errorMessage);
            }

            setScreenState('configure');
        }
    }, [
        selectedDevice,
        network,
        accountNumber,
        setUseWalletInterfaceType,
        setLedgerAccountNumber,
        disconnect,
        createLedgerWallet,
    ]);

    const handleBack = useCallback(() => {
        if (screenState === 'scanning') {
            handleStopScan();
            setScreenState('instructions');
        } else if (screenState === 'configure') {
            disconnect();
            setSelectedDevice(null);
            setScreenState('scanning');
            startScan();
        } else {
            router.back();
        }
    }, [screenState, handleStopScan, disconnect, startScan]);

    const renderContent = () => {
        switch (screenState) {
            case 'instructions':
                return <InstructionsStep onStartScan={handleStartScan} />;

            case 'scanning':
                return (
                    <ScanningStep
                        isScanning={status === 'scanning'}
                        devices={devices}
                        connectingDeviceId={status === 'connecting' ? selectedDevice?.id : undefined}
                        error={connectionError}
                        onDeviceSelect={handleDeviceSelect}
                        onStopScan={handleStopScan}
                        onStartScan={handleStartScan}
                    />
                );

            case 'configure':
                return (
                    <ConfigureStep
                        deviceName={selectedDevice?.name}
                        network={network}
                        onNetworkChange={setNetwork}
                        accountNumber={accountNumber}
                        onAccountNumberChange={setAccountNumber}
                        onCreateWallet={handleCreateWallet}
                    />
                );

            case 'connecting':
                return <ConnectingStep />;
        }
    };

    return (
        <ScreenWrapper>
            <ScreenHeader.Container>
                <ScreenHeader.LeftSide>
                    <ScreenHeader.BackButton onCustomBackPress={handleBack} />
                </ScreenHeader.LeftSide>

                <ScreenHeader.Title>Connect Ledger</ScreenHeader.Title>
            </ScreenHeader.Container>

            <View style={styles.content}>
                <View style={styles.header}>
                    <AppText style={styles.subtitle}>{SUBTITLES[screenState]}</AppText>
                </View>

                {renderContent()}
            </View>
        </ScreenWrapper>
    );
};

export default ConnectLedgerScreen;

const styles = StyleSheet.create(({ sizes, colors }) => ({
    content: {
        flex: 1,
        paddingTop: sizes.space.vertical,
        paddingBottom: sizes.space.vertical * 2,
        gap: sizes.space.vertical,
    },
    header: {
        gap: sizes.space.vertical,
    },
    subtitle: {
        color: colors.text.secondary,
    },
}));
