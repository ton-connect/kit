/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from 'vitest';

import { createStandardWalletRecord, createPendingAgenticDeployment } from '../registry/config.js';
import { sanitizePrivateKeyBackedValue, sanitizeStoredWallet } from '../tools/sanitize.js';

describe('sanitize', () => {
    const address = 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c';

    it.each([
        {
            name: 'standard wallets',
            value: {
                ...createStandardWalletRecord({
                    name: 'Primary',
                    network: 'mainnet',
                    walletVersion: 'v5r1',
                    address,
                }),
                mnemonic: 'abandon '.repeat(23) + 'about',
            },
            sanitize: sanitizeStoredWallet,
            expected: {
                has_mnemonic: true,
                has_private_key: false,
            },
        },
    ])('omits secret fields for $name', ({ value, sanitize, expected }) => {
        const sanitized = sanitize(value);

        expect(sanitized).toMatchObject(expected);
        expect(sanitized).not.toHaveProperty('mnemonic');
        expect(sanitized).not.toHaveProperty('private_key');
        expect(sanitized).not.toHaveProperty('sign_method');
    });

    it('treats unreadable secret files as missing secrets', () => {
        const standardWallet = {
            ...createStandardWalletRecord({
                name: 'Broken primary',
                network: 'mainnet',
                walletVersion: 'v5r1',
                address,
            }),
            sign_method: { type: 'local_file' as const, file_path: 'private-keys/wallets/missing.mnemonic' },
            secret_type: 'mnemonic' as const,
        };
        const pendingDeployment = {
            ...createPendingAgenticDeployment({
                network: 'mainnet',
                operatorPublicKey: '0xcafe',
            }),
            sign_method: {
                type: 'local_file' as const,
                file_path: 'private-keys/pending-agentic-deployments/missing.private-key',
            },
        };

        expect(sanitizeStoredWallet(standardWallet)).toMatchObject({
            has_mnemonic: false,
            has_private_key: false,
        });
        expect(sanitizePrivateKeyBackedValue(pendingDeployment)).toMatchObject({
            has_private_key: false,
        });
    });
});
