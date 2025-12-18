/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export { useLedgerConnection } from './hooks/use-ledger-connection';
export type {
    LedgerConnectionStatus,
    UseLedgerConnectionReturn,
    UseLedgerConnectionOptions,
} from './hooks/use-ledger-connection';
export type { LedgerDevice, ScanSubscription } from './utils/ledger-transport';
export { scanLedgerDevices, connectToLedgerDevice, disconnectLedgerDevice } from './utils/ledger-transport';
export { createBLELedgerTransportFactory } from './utils/create-ble-transport-factory';
export type { LedgerDeviceStorage } from './utils/create-ble-transport-factory';
