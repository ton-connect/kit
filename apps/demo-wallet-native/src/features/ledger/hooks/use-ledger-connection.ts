/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import type Transport from '@ledgerhq/hw-transport';
import { TonTransport } from '@ton-community/ton-ledger';

import { scanLedgerDevices, connectToLedgerDevice, disconnectLedgerDevice } from '../utils/ledger-transport';
import type { LedgerDevice, ScanSubscription } from '../utils/ledger-transport';

export type LedgerConnectionStatus =
    | 'idle'
    | 'requesting_permissions'
    | 'scanning'
    | 'connecting'
    | 'connected'
    | 'error';

export interface UseLedgerConnectionOptions {
    /**
     * Callback called when a device is successfully connected.
     * Use this to persist the device ID for later reconnection.
     */
    onDeviceConnected?: (device: LedgerDevice) => void | Promise<void>;
    /**
     * Callback called when a device is disconnected.
     * Use this to clear the persisted device ID if needed.
     */
    onDeviceDisconnected?: () => void | Promise<void>;
}

export interface UseLedgerConnectionReturn {
    status: LedgerConnectionStatus;
    devices: LedgerDevice[];
    connectedDevice: LedgerDevice | null;
    error: string | null;
    transport: Transport | null;
    tonTransport: TonTransport | null;
    startScan: () => Promise<void>;
    stopScan: () => void;
    connect: (device: LedgerDevice) => Promise<void>;
    disconnect: () => Promise<void>;
}

export const useLedgerConnection = (options?: UseLedgerConnectionOptions): UseLedgerConnectionReturn => {
    const { onDeviceConnected, onDeviceDisconnected } = options ?? {};
    const [status, setStatus] = useState<LedgerConnectionStatus>('idle');
    const [devices, setDevices] = useState<LedgerDevice[]>([]);
    const [connectedDevice, setConnectedDevice] = useState<LedgerDevice | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [transport, setTransport] = useState<Transport | null>(null);
    const [tonTransport, setTonTransport] = useState<TonTransport | null>(null);

    const subscriptionRef = useRef<ScanSubscription | null>(null);

    const requestPermissions = useCallback(async (): Promise<boolean> => {
        if (Platform.OS === 'android') {
            setStatus('requesting_permissions');

            try {
                const granted = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                ]);

                const allGranted = Object.values(granted).every(
                    (permission) => permission === PermissionsAndroid.RESULTS.GRANTED,
                );

                if (!allGranted) {
                    setError('Bluetooth permissions are required to connect to Ledger');
                    setStatus('error');
                    return false;
                }

                setStatus('idle');
                return true;
            } catch (_err) {
                setError('Failed to request Bluetooth permissions');
                setStatus('error');
                return false;
            }
        }

        return true;
    }, []);

    const startScan = useCallback(async (): Promise<void> => {
        setError(null);
        setDevices([]);

        const hasPermissions = await requestPermissions();

        if (!hasPermissions) {
            return;
        }

        setStatus('scanning');

        subscriptionRef.current = scanLedgerDevices(
            (device) => {
                setDevices((prev) => {
                    const exists = prev.some((d) => d.id === device.id);

                    if (exists) {
                        return prev;
                    }

                    return [...prev, device];
                });
            },
            (err) => {
                setError(err.message || 'Failed to scan for devices');
                setStatus('error');
            },
        );
    }, [requestPermissions]);

    const stopScan = useCallback((): void => {
        if (subscriptionRef.current) {
            subscriptionRef.current.unsubscribe();
            subscriptionRef.current = null;
        }

        if (status === 'scanning') {
            setStatus('idle');
        }
    }, [status]);

    const connect = useCallback(
        async (device: LedgerDevice): Promise<void> => {
            stopScan();
            setStatus('connecting');
            setError(null);

            try {
                const newTransport = await connectToLedgerDevice(device.id);
                const newTonTransport = new TonTransport(newTransport);

                setTransport(newTransport);
                setTonTransport(newTonTransport);
                setConnectedDevice(device);
                setStatus('connected');

                // Notify about successful connection (e.g., to persist device ID)
                await onDeviceConnected?.(device);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to connect to device';
                setError(errorMessage);
                setStatus('error');
                throw err;
            }
        },
        [stopScan, onDeviceConnected],
    );

    const disconnect = useCallback(async (): Promise<void> => {
        try {
            if (transport) {
                await disconnectLedgerDevice(transport);
            }
        } catch (err) {
            console.error('Error disconnecting:', err);
        }

        setTransport(null);
        setTonTransport(null);
        setConnectedDevice(null);
        setStatus('idle');

        // Notify about disconnection
        await onDeviceDisconnected?.();
    }, [transport, onDeviceDisconnected]);

    useEffect(() => {
        return () => {
            if (subscriptionRef.current) {
                subscriptionRef.current.unsubscribe();
            }

            if (transport) {
                transport.close().catch(console.error);
            }
        };
    }, [transport]);

    return {
        status,
        devices,
        connectedDevice,
        error,
        transport,
        tonTransport,
        startScan,
        stopScan,
        connect,
        disconnect,
    };
};
