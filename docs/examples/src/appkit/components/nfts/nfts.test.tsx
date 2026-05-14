/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { Network } from '@ton/walletkit';

import { createWrapper } from '../../../__tests__/test-utils';
import { NftItemExample } from './nft-item';

describe('NFTs Component Examples', () => {
    let mockAppKit: any;

    beforeEach(() => {
        mockAppKit = {
            getDefaultNetwork: () => Network.mainnet(),
            connectors: [],
            walletsManager: { selectedWallet: null },
            networkManager: { getClient: () => ({}) },
            emitter: { on: () => () => {}, off: () => {} },
        };
    });

    afterEach(() => cleanup());

    it('NftItemExample renders the NFT name', () => {
        render(<NftItemExample />, { wrapper: createWrapper(mockAppKit) });
        expect(screen.getByText('TON Diamond #42')).toBeDefined();
    });
});
