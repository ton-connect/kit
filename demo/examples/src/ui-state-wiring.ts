/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import 'dotenv/config';
import type {
    ConnectionRequest,
    ConnectionRequestEvent,
    SendTransactionRequest,
    SendTransactionRequestEvent,
} from '@ton/walletkit';

import { walletKitInitializeSample, getSelectedWalletAddress } from './lib/walletKitInitializeSample';

/**
 * npx tsx src/ui-state-wiring.ts
 *
 * Example script that demonstrates minimal UI state wiring for handling
 * connect and transaction requests.
 */

export async function main() {
    console.log('=== Minimal UI State Wiring Example ===');
    const kit = await walletKitInitializeSample();
    const wiring = createMinimalUiStateWiring(kit);
    console.log('✓ UI state wiring example completed');
    console.log('State management functions are ready to use:');
    console.log('  - approveConnect()');
    await wiring.approveConnect();
    console.log('  - rejectConnect()');
    await wiring.rejectConnect();
    console.log('  - approveTx()');
    await wiring.approveTx();
    console.log('  - rejectTx()');
    await wiring.rejectTx();

    await kit.close();
}

export function createMinimalUiStateWiring(kit: {
    onConnectRequest: (handler: (req: ConnectionRequestEvent) => void) => void;
    onTransactionRequest: (handler: (tx: SendTransactionRequestEvent) => void) => void;
    getWallet: (idOrAddress: string) => { getAddress: () => string } | undefined;
    approveConnectRequest: (req: ConnectionRequest) => Promise<unknown>;
    rejectConnectRequest: (req: ConnectionRequest, reason: string) => Promise<unknown>;
    approveTransactionRequest: (req: SendTransactionRequest) => Promise<unknown>;
    rejectTransactionRequest: (req: SendTransactionRequest, reason: string) => Promise<unknown>;
}) {
    // SAMPLE_START: MINIMAL_UI_STATE_WIRING
    type AppState = {
        connectModal?: { event: ConnectionRequestEvent };
        txModal?: { event: SendTransactionRequestEvent };
    };

    const state: AppState = {};

    kit.onConnectRequest((req) => {
        state.connectModal = { event: req };
    });

    kit.onTransactionRequest((tx) => {
        state.txModal = { event: tx };
    });

    async function approveConnect() {
        if (!state.connectModal) return;
        const address = getSelectedWalletAddress();
        const wallet = kit.getWallet(address);
        if (!wallet) return;
        // Set wallet address on the request
        state.connectModal.event.walletAddress = wallet.getAddress();
        await kit.approveConnectRequest({ event: state.connectModal.event });
        state.connectModal = undefined;
    }

    async function rejectConnect() {
        if (!state.connectModal) return;
        await kit.rejectConnectRequest({ event: state.connectModal.event }, 'User rejected');
        state.connectModal = undefined;
    }

    async function approveTx() {
        if (!state.txModal) return;
        await kit.approveTransactionRequest({ event: state.txModal.event });
        state.txModal = undefined;
    }

    async function rejectTx() {
        if (!state.txModal) return;
        await kit.rejectTransactionRequest({ event: state.txModal.event }, 'User rejected');
        state.txModal = undefined;
    }
    // SAMPLE_END: MINIMAL_UI_STATE_WIRING
    return { state, approveConnect, rejectConnect, approveTx, rejectTx };
}

/* istanbul ignore next */
if (process.env.VITEST !== 'true') {
    main().catch((error) => {
        console.error(error);
        process.exit(1);
    });
}
