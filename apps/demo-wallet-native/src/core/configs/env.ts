/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { z } from 'zod';

const envSchema = z.object({
    bridge: z.object({
        url: z.string().min(1),
    }),
    tonApi: z.object({
        mainnetApiKey: z.string().min(1),
        testnetApiKey: z.string().min(1),
    }),
    ledger: z.object({
        deviceIdKey: z.string().min(1),
    }),
});

type EnvConfig = z.infer<typeof envSchema>;

const envObj: EnvConfig = {
    bridge: {
        url: (process.env.EXPO_PUBLIC_BRIDGE_URL as string).trim() || 'https://walletbot.me/tonconnect-bridge/bridge',
    },
    tonApi: {
        mainnetApiKey:
            (process.env.EXPO_PUBLIC_TON_API_KEY_MAINNET as string).trim() ||
            '25a9b2326a34b39a5fa4b264fb78fb4709e1bd576fc5e6b176639f5b71e94b0d',
        testnetApiKey:
            (process.env.EXPO_PUBLIC_TON_API_KEY_TESTNET as string).trim() ||
            'd852b54d062f631565761042cccea87fa6337c41eb19b075e6c7fb88898a3992',
    },
    ledger: {
        deviceIdKey: (process.env.EXPO_PUBLIC_LEDGER_DEVICE_ID_KEY as string).trim() || 'ledger_device_id',
    },
};

export const envConfig = envSchema.parse(envObj);
