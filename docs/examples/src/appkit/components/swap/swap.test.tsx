/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { render, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { Network } from '@ton/walletkit';

import { createWrapper } from '../../../__tests__/test-utils';
import { SwapWidgetExample } from './swap-widget';

describe('Swap Component Examples', () => {
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
            swapManager: {
                getProviders: () => providers,
                getProvider: () => undefined,
                hasProvider: () => false,
            },
            emitter: { on: () => () => {}, off: () => {} },
        };
    });

    afterEach(() => cleanup());

    it('SwapWidgetExample renders without crashing', () => {
        const { container } = render(<SwapWidgetExample />, { wrapper: createWrapper(mockAppKit) });
        expect(container).toBeDefined();
    });
});
