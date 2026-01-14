/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Storage adapter for Ledger device ID using AsyncStorage.
 * This persists the last connected Ledger device ID for reconnection.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import type { LedgerDeviceStorage } from '@/features/ledger';
import { envConfig } from '@/core/configs/env';

const { ledger } = envConfig;

export const ledgerDeviceStorage: LedgerDeviceStorage = {
    getDeviceId: () => AsyncStorage.getItem(ledger.deviceIdKey),
    setDeviceId: (deviceId: string) => AsyncStorage.setItem(ledger.deviceIdKey, deviceId),
    clearDeviceId: () => AsyncStorage.removeItem(ledger.deviceIdKey),
};
