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
import { SwapWidgetExample } from './swap-widget';
import { SwapFieldExample } from './swap-field';
import { SwapFlipButtonExample } from './swap-flip-button';
import { SwapInfoExample } from './swap-info';

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

    it('SwapFieldExample renders the token ticker', () => {
        render(<SwapFieldExample />, { wrapper: createWrapper(mockAppKit) });
        expect(screen.getByText('TON')).toBeDefined();
    });

    it('SwapFlipButtonExample renders a clickable button', () => {
        render(<SwapFlipButtonExample />, { wrapper: createWrapper(mockAppKit) });
        expect(screen.getByRole('button')).toBeDefined();
    });

    // Confirms the SAMPLE comment: with `quote` / `provider` undefined the
    // min-received row reads `0 USDT` and the provider row falls back to a
    // skeleton placeholder.
    it('SwapInfoExample shows `0 USDT` for min-received and a skeleton for the provider when no quote is set', () => {
        const { container } = render(<SwapInfoExample />, { wrapper: createWrapper(mockAppKit) });
        expect(screen.getByText(/0\s*USDT/)).toBeDefined();
        // Provider row falls back to ValueSkeleton — assert a skeleton element exists.
        const skeleton = container.querySelector('[class*="skeleton" i]');
        expect(skeleton).not.toBeNull();
    });
});
