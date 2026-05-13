/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { render, cleanup, screen } from '@testing-library/react';
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { Network } from '@ton/walletkit';

import { createWrapper } from '../../../__tests__/test-utils';
import { CryptoOnrampWidgetExample } from './crypto-onramp-widget';

describe('Crypto Onramp Component Examples', () => {
    let mockAppKit: any;

    beforeEach(() => {
        // Stable references — `useSyncExternalStore` re-renders on every snapshot
        // identity change, so returning a fresh `[]` per call causes an infinite loop.
        const networks = [Network.mainnet()];
        const providers: unknown[] = [];
        mockAppKit = {
            getDefaultNetwork: () => Network.mainnet(),
            connectors: [],
            walletsManager: { selectedWallet: null, getSelectedWallet: () => null },
            networkManager: {
                getClient: () => ({}),
                getDefaultNetwork: () => Network.mainnet(),
                getConfiguredNetworks: () => networks,
                getNetworks: () => networks,
            },
            cryptoOnrampManager: {
                getProviders: () => providers,
                getProvider: () => undefined,
                hasProvider: () => false,
            },
            emitter: { on: () => () => {}, off: () => {} },
        };
    });

    afterEach(() => cleanup());

    // Confirms the SAMPLE comment: with no `tokens` / `paymentMethods` props, the
    // widget surfaces its built-in TON target token (and renders without crashing).
    it('CryptoOnrampWidgetExample falls back to built-in defaults when no tokens are supplied', () => {
        render(<CryptoOnrampWidgetExample />, { wrapper: createWrapper(mockAppKit) });
        // `defaultTokenId="ton"` picks the built-in TON entry from `CRYPTO_ONRAMP_TARGET_TOKENS`.
        // Multiple `TON` matches can appear (token ticker + chain name); at least one must.
        expect(screen.getAllByText(/\bTON\b/).length).toBeGreaterThan(0);
    });
});
