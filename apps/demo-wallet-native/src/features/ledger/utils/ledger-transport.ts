/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import TransportBLE from '@ledgerhq/react-native-hw-transport-ble';
import type Transport from '@ledgerhq/hw-transport';
import type { Device } from 'react-native-ble-plx';

export interface LedgerDevice {
    id: string;
    name: string;
    device: Device;
}

export interface ScanSubscription {
    unsubscribe: () => void;
}

/**
 * Start scanning for Ledger devices via Bluetooth
 */
export function scanLedgerDevices(
    onDeviceFound: (device: LedgerDevice) => void,
    onError?: (error: Error) => void,
): ScanSubscription {
    return TransportBLE.listen({
        next: (event: { type: string; descriptor: Device }) => {
            if (event.type === 'add' && event.descriptor) {
                const device = event.descriptor;
                onDeviceFound({
                    id: device.id,
                    name: device.name || device.localName || 'Ledger Device',
                    device,
                });
            }
        },
        error: (error: Error) => {
            onError?.(error);
        },
        complete: () => {},
    });
}

/**
 * Connect to a Ledger device and return the transport
 */
export async function connectToLedgerDevice(deviceId: string): Promise<Transport> {
    return TransportBLE.open(deviceId);
}

/**
 * Disconnect from a Ledger device
 */
export async function disconnectLedgerDevice(transport: Transport): Promise<void> {
    await transport.close();
}
