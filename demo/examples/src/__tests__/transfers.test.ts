/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect, beforeEach } from 'vitest';

import { resetKitCache } from '../lib/walletKitInitializeSample';
import { main as sendTon } from '../send-ton';
import { main as sendJettons } from '../send-jettons';
import { main as sendNft } from '../send-nft';

describe('transfers', () => {
    beforeEach(() => {
        resetKitCache();
    });

    it('should send TON', async () => {
        await expect(sendTon()).resolves.not.toThrow();
    });

    it('should send Jettons and fetch NFTs', async () => {
        resetKitCache();
        await expect(sendJettons()).resolves.not.toThrow();
    });

    it('should send NFT', async () => {
        resetKitCache();
        await expect(sendNft()).resolves.not.toThrow();
    });
});
