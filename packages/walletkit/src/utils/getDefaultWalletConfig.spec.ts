/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect } from 'vitest';

import { getDeviceInfoForWallet, getDeviceInfoWithDefaults } from './getDefaultWalletConfig';
import type { WalletAdapter } from '../api/interfaces';
import type { Feature } from '../types/jsBridge';

describe('getDeviceInfoForWallet', () => {
    it('should return default deviceInfo when wallet adapter does not have getSupportedFeatures', () => {
        const mockAdapter = {
            getPublicKey: () => '0x123',
            getNetwork: () => ({ chainId: -239 }),
            getSupportedFeatures: () => undefined,
        } as unknown as WalletAdapter;

        const deviceInfo = getDeviceInfoForWallet(mockAdapter);

        expect(deviceInfo.features).toEqual([
            'SendTransaction',
            {
                name: 'SendTransaction',
                maxMessages: 1,
            },
        ]);
    });

    it('should not add SendTransaction when adapter has no SendTransaction features', () => {
        const customFeatures: Feature[] = [
            {
                name: 'SignData',
                types: ['binary'],
            },
        ];

        const mockLedgerAdapter = {
            getPublicKey: () => '0x123',
            getNetwork: () => ({ chainId: -239 }),
            getSupportedFeatures: () => customFeatures,
        } as unknown as WalletAdapter;

        const deviceInfo = getDeviceInfoForWallet(mockLedgerAdapter);

        expect(deviceInfo.features).toEqual([
            {
                name: 'SignData',
                types: ['binary'],
            },
        ]);
    });

    it('should not duplicate SendTransaction when adapter already has it as string', () => {
        const customFeatures: Feature[] = [
            'SendTransaction',
            {
                name: 'SignData',
                types: ['binary'],
            },
        ];

        const mockAdapter = {
            getPublicKey: () => '0x123',
            getNetwork: () => ({ chainId: -239 }),
            getSupportedFeatures: () => customFeatures,
        } as unknown as WalletAdapter;

        const deviceInfo = getDeviceInfoForWallet(mockAdapter);

        expect(deviceInfo.features).toEqual([
            'SendTransaction',
            {
                name: 'SignData',
                types: ['binary'],
            },
        ]);
    });

    it('should add SendTransaction string when adapter has only SendTransaction object', () => {
        const customFeatures: Feature[] = [
            {
                name: 'SendTransaction',
                maxMessages: 4,
            },
            {
                name: 'SignData',
                types: ['binary'],
            },
        ];

        const mockAdapter = {
            getPublicKey: () => '0x123',
            getNetwork: () => ({ chainId: -239 }),
            getSupportedFeatures: () => customFeatures,
        } as unknown as WalletAdapter;

        const deviceInfo = getDeviceInfoForWallet(mockAdapter);

        expect(deviceInfo.features).toEqual([
            'SendTransaction',
            {
                name: 'SendTransaction',
                maxMessages: 4,
            },
            {
                name: 'SignData',
                types: ['binary'],
            },
        ]);
    });

    it('should not duplicate SendTransaction when adapter has both string and object forms', () => {
        const customFeatures: Feature[] = [
            'SendTransaction',
            {
                name: 'SendTransaction',
                maxMessages: 4,
            },
            {
                name: 'SignData',
                types: ['binary'],
            },
        ];

        const mockAdapter = {
            getPublicKey: () => '0x123',
            getNetwork: () => ({ chainId: -239 }),
            getSupportedFeatures: () => customFeatures,
        } as unknown as WalletAdapter;

        const deviceInfo = getDeviceInfoForWallet(mockAdapter);

        expect(deviceInfo.features).toEqual([
            'SendTransaction',
            {
                name: 'SendTransaction',
                maxMessages: 4,
            },
            {
                name: 'SignData',
                types: ['binary'],
            },
        ]);
    });
});

describe('getDeviceInfoWithDefaults', () => {
    it('should return default deviceInfo when no options provided', () => {
        const deviceInfo = getDeviceInfoWithDefaults();

        expect(deviceInfo).toEqual({
            platform: 'browser',
            appName: 'Wallet',
            appVersion: '1.0.0',
            maxProtocolVersion: 2,
            features: [
                'SendTransaction',
                {
                    name: 'SendTransaction',
                    maxMessages: 1,
                },
            ],
        });
    });

    it('should merge custom options with defaults', () => {
        const deviceInfo = getDeviceInfoWithDefaults({
            appName: 'CustomWallet',
            appVersion: '2.0.0',
        });

        expect(deviceInfo.appName).toBe('CustomWallet');
        expect(deviceInfo.appVersion).toBe('2.0.0');
        expect(deviceInfo.platform).toBe('browser');
        expect(deviceInfo.maxProtocolVersion).toBe(2);
    });

    it('should add SendTransaction string when custom options have only SendTransaction object', () => {
        const deviceInfo = getDeviceInfoWithDefaults({
            features: [
                {
                    name: 'SendTransaction',
                    maxMessages: 4,
                },
            ],
        });

        expect(deviceInfo.features).toEqual([
            'SendTransaction',
            {
                name: 'SendTransaction',
                maxMessages: 4,
            },
        ]);
    });

    it('should not duplicate SendTransaction when custom options already have it as string', () => {
        const deviceInfo = getDeviceInfoWithDefaults({
            features: [
                'SendTransaction',
                {
                    name: 'SendTransaction',
                    maxMessages: 4,
                },
            ],
        });

        expect(deviceInfo.features).toEqual([
            'SendTransaction',
            {
                name: 'SendTransaction',
                maxMessages: 4,
            },
        ]);
    });

    it('should add SendTransaction string when custom options have SendTransaction object with SignData', () => {
        const deviceInfo = getDeviceInfoWithDefaults({
            features: [
                {
                    name: 'SendTransaction',
                    maxMessages: 10,
                },
                {
                    name: 'SignData',
                    types: ['binary', 'text'],
                },
            ],
        });

        expect(deviceInfo.features).toEqual([
            'SendTransaction',
            {
                name: 'SendTransaction',
                maxMessages: 10,
            },
            {
                name: 'SignData',
                types: ['binary', 'text'],
            },
        ]);
    });

    it('should not add SendTransaction string when custom options have only SignData', () => {
        const deviceInfo = getDeviceInfoWithDefaults({
            features: [
                {
                    name: 'SignData',
                    types: ['binary'],
                },
            ],
        });

        expect(deviceInfo.features).toEqual([
            {
                name: 'SignData',
                types: ['binary'],
            },
        ]);
    });

    it('should preserve custom platform and maxProtocolVersion with custom features', () => {
        const deviceInfo = getDeviceInfoWithDefaults({
            platform: 'mac',
            maxProtocolVersion: 3,
            features: [
                {
                    name: 'SendTransaction',
                    maxMessages: 5,
                },
            ],
        });

        expect(deviceInfo.platform).toBe('mac');
        expect(deviceInfo.maxProtocolVersion).toBe(3);
        expect(deviceInfo.features).toEqual([
            'SendTransaction',
            {
                name: 'SendTransaction',
                maxMessages: 5,
            },
        ]);
    });
});
