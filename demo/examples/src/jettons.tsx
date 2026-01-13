/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { walletKitInitializeSample } from './lib/walletKitInitializeSample';

async function main() {
    const kit = await walletKitInitializeSample();
    // SAMPLE_START: GET_JETTON_INFO
    // Example usage (this would be in your component/handler):
    const info = kit.jettons.getJettonInfo(jettonAddress);
    // info?.name, info?.symbol, info?.image
    // SAMPLE_END: GET_JETTON_INFO
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
