/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import 'dotenv/config';

import { CHAIN } from '@ton/walletkit';

import { walletKitInitializeSample } from './lib/walletKitInitializeSample';

/**
 * pnpm tsx src/jettons.ts
 */
export async function main() {
    const kit = await walletKitInitializeSample();
    const jettonAddress = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';
    // SAMPLE_START: GET_JETTON_INFO
    const info = kit.jettons.getJettonInfo(jettonAddress, CHAIN.MAINNET);
    // info?.name, info?.symbol, info?.image
    // SAMPLE_END: GET_JETTON_INFO
    console.log(info);
}

/* istanbul ignore next */
if (process.env.VITEST !== 'true') {
    main().catch((error) => {
        console.error(error);
        process.exit(1);
    });
}
