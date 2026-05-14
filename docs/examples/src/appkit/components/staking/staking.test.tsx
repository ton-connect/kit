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
import { StakingWidgetExample } from './staking-widget';
import { SelectUnstakeModeExample } from './select-unstake-mode';
import { StakingSettingsModalExample } from './staking-settings-modal';
import { StakingBalanceBlockExample } from './staking-balance-block';

describe('Staking Component Examples', () => {
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
            stakingManager: {
                getProviders: () => providers,
                getProvider: () => undefined,
                hasProvider: () => false,
            },
            emitter: { on: () => () => {}, off: () => {} },
        };
    });

    afterEach(() => cleanup());

    it('StakingWidgetExample renders without crashing', () => {
        const { container } = render(<StakingWidgetExample />, { wrapper: createWrapper(mockAppKit) });
        expect(container).toBeDefined();
    });

    it('SelectUnstakeModeExample renders without crashing', () => {
        const { container } = render(<SelectUnstakeModeExample />, { wrapper: createWrapper(mockAppKit) });
        expect(container).toBeDefined();
    });

    it('StakingSettingsModalExample renders without crashing', () => {
        const { container } = render(<StakingSettingsModalExample />, { wrapper: createWrapper(mockAppKit) });
        expect(container).toBeDefined();
    });

    it('StakingBalanceBlockExample renders without crashing', () => {
        const { container } = render(<StakingBalanceBlockExample />, { wrapper: createWrapper(mockAppKit) });
        expect(container).toBeDefined();
    });
});
