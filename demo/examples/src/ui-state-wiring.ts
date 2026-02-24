/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import 'dotenv/config';
import type { ConnectionRequestEvent, SendTransactionRequestEvent } from '@ton/walletkit';

import { walletKitInitializeSample, getSelectedWalletAddress } from './lib/wallet-kit-initialize-sample';

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

type WalletLike = { getAddress: () => Promise<string> };

export function createMinimalUiStateWiring(kit: {
    onConnectRequest: (handler: (req: ConnectionRequestEvent) => void) => void;
    onTransactionRequest: (handler: (tx: SendTransactionRequestEvent) => void) => void;
    getWallet: (idOrAddress: string) => WalletLike | undefined | Promise<WalletLike | undefined>;
    approveConnectRequest: (req: ConnectionRequestEvent) => Promise<unknown>;
    rejectConnectRequest: (req: ConnectionRequestEvent, reason: string) => Promise<unknown>;
    approveTransactionRequest: (req: SendTransactionRequestEvent) => Promise<unknown>;
    rejectTransactionRequest: (req: SendTransactionRequestEvent, reason: string) => Promise<unknown>;
}) {
    // SAMPLE_START: MINIMAL_UI_STATE_WIRING
    type AppState = {
        connectModal?: { request: ConnectionRequestEvent };
        txModal?: { request: SendTransactionRequestEvent };
    };

    const state: AppState = {};

    kit.onConnectRequest((req) => {
        state.connectModal = { request: req };
    });

    kit.onTransactionRequest((tx) => {
        state.txModal = { request: tx };
    });

    async function approveConnect() {
        if (!state.connectModal) return;
        const address = await getSelectedWalletAddress();
        const wallet = await Promise.resolve(kit.getWallet(address));
        if (!wallet) return;
        // Set wallet address on the request
        state.connectModal.request.walletAddress = await wallet.getAddress();
        await kit.approveConnectRequest(state.connectModal.request);
        state.connectModal = undefined;
    }

    async function rejectConnect() {
        if (!state.connectModal) return;
        await kit.rejectConnectRequest(state.connectModal.request, 'User rejected');
        state.connectModal = undefined;
    }

    async function approveTx() {
        if (!state.txModal) return;
        await kit.approveTransactionRequest(state.txModal.request);
        state.txModal = undefined;
    }

    async function rejectTx() {
        if (!state.txModal) return;
        await kit.rejectTransactionRequest(state.txModal.request, 'User rejected');
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
