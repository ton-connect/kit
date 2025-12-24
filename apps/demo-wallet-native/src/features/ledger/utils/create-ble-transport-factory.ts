/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import TransportBLE from '@ledgerhq/react-native-hw-transport-ble';
import type Transport from '@ledgerhq/hw-transport';
import type { CreateLedgerTransportFunction } from '@ton/demo-core';

/**
 * Storage interface for persisting Ledger device ID
 */
export interface LedgerDeviceStorage {
    getDeviceId: () => Promise<string | null>;
    setDeviceId: (deviceId: string) => Promise<void>;
    clearDeviceId: () => Promise<void>;
}

/**
 * Creates a factory function for BLE Ledger transport.
 *
 * This factory uses a stored device ID to reconnect to a previously paired
 * Ledger device. The device ID should be set after the user selects a device
 * from the scan results.
 *
 * @param storage - Storage adapter for persisting device ID
 * @returns Factory function that creates BLE transport
 *
 * @example
 * ```typescript
 * // Create storage adapter (e.g., using AsyncStorage)
 * const storage: LedgerDeviceStorage = {
 *   getDeviceId: () => AsyncStorage.getItem('ledger_device_id'),
 *   setDeviceId: (id) => AsyncStorage.setItem('ledger_device_id', id),
 *   clearDeviceId: () => AsyncStorage.removeItem('ledger_device_id'),
 * };
 *
 * // Create the transport factory
 * const createLedgerTransport = createBLELedgerTransportFactory(storage);
 *
 * // Use in walletKitConfig
 * const walletKitConfig = {
 *   createLedgerTransport,
 *   // ...other config
 * };
 * ```
 */
export function createBLELedgerTransportFactory(storage: LedgerDeviceStorage): CreateLedgerTransportFunction {
    return async (): Promise<Transport> => {
        const deviceId = await storage.getDeviceId();

        if (!deviceId) {
            throw new Error(
                'No Ledger device ID stored. Please connect to a Ledger device first using the device scanner.',
            );
        }

        try {
            return await TransportBLE.open(deviceId);
        } catch (error) {
            // If connection fails, clear the stored device ID
            await storage.clearDeviceId();
            throw new Error(
                `Failed to connect to Ledger device: ${error instanceof Error ? error.message : String(error)}. ` +
                    'Please reconnect your device.',
            );
        }
    };
}
