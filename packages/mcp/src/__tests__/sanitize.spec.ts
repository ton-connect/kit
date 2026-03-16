/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from 'vitest';

import {
    createAgenticWalletRecord,
    createPendingAgenticDeployment,
    createPendingAgenticKeyRotation,
    createStandardWalletRecord,
} from '../registry/config.js';
import { sanitizePrivateKeyBackedValue, sanitizeStoredWallet } from '../tools/sanitize.js';

describe('sanitize', () => {
    const address = 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c';
    const ownerAddress = 'EQByQ19qvWxW7VibSbGEgZiYMqilHY5y1a_eeSL2VaXhfy07';

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
        {
            name: 'agentic wallets',
            value: {
                ...createAgenticWalletRecord({
                    name: 'Agent',
                    network: 'mainnet',
                    address,
                    ownerAddress,
                    operatorPublicKey: '0xbeef',
                }),
                private_key: '0x' + '11'.repeat(32),
            },
            sanitize: sanitizeStoredWallet,
            expected: {
                has_private_key: true,
            },
        },
        {
            name: 'pending agentic deployments',
            value: {
                ...createPendingAgenticDeployment({
                    network: 'mainnet',
                    operatorPublicKey: '0xcafe',
                }),
                private_key: '0x' + '22'.repeat(32),
            },
            sanitize: sanitizePrivateKeyBackedValue,
            expected: {
                has_private_key: true,
            },
        },
        {
            name: 'pending agentic rotations',
            value: {
                ...createPendingAgenticKeyRotation({
                    walletId: 'wallet-1',
                    network: 'mainnet',
                    walletAddress: address,
                    ownerAddress,
                    operatorPublicKey: '0xfade',
                }),
                private_key: '0x' + '33'.repeat(32),
            },
            sanitize: sanitizePrivateKeyBackedValue,
            expected: {
                has_private_key: true,
            },
        },
    ])('omits secret fields for $name', ({ value, sanitize, expected }) => {
        const sanitized = sanitize(value);

        expect(sanitized).toMatchObject(expected);
        expect(sanitized).not.toHaveProperty('mnemonic');
        expect(sanitized).not.toHaveProperty('private_key');
        expect(sanitized).not.toHaveProperty('secret_file');
    });

    it('treats unreadable secret files as missing secrets', () => {
        const standardWallet = {
            ...createStandardWalletRecord({
                name: 'Broken primary',
                network: 'mainnet',
                walletVersion: 'v5r1',
                address,
            }),
            secret_file: 'private-keys/wallets/missing.mnemonic',
            secret_type: 'mnemonic' as const,
        };
        const pendingDeployment = {
            ...createPendingAgenticDeployment({
                network: 'mainnet',
                operatorPublicKey: '0xcafe',
            }),
            secret_file: 'private-keys/pending-agentic-deployments/missing.private-key',
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
