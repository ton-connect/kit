import { mockFn, mocked, useFakeTimers, useRealTimers } from '../../mock.config';
import { TonWalletKit } from './TonWalletKit';
import type { TonWalletKitOptions } from '../types';
import { createDummyWallet, createMockApiClient } from '../contracts/w5/WalletV5R1.fixture';
import { InjectedToExtensionBridgeRequest, InjectedToExtensionBridgeRequestPayload } from '../types/jsBridge';

const mockApiClient = createMockApiClient();

mocked('./ApiClientToncenter', () => {
    return {
        ApiClientToncenter: mockFn().mockImplementation(() => mockApiClient),
    };
});

describe('TonWalletKit', () => {
    beforeEach(() => {
        useFakeTimers();
    });

    afterEach(() => {
        useRealTimers();
    });

    const createKit = async () => {
        const options: TonWalletKitOptions = {
            apiKey: 'test',
            config: {
                bridge: {
                    enableJsBridge: false,
                    bridgeName: 'test',
                },
                eventProcessor: {
                    disableEvents: true,
                },
            },
            // Ensure we have storage in node env
            storage: {
                get: mockFn().mockResolvedValue(null),
                set: mockFn().mockResolvedValue(undefined),
                remove: mockFn().mockResolvedValue(undefined),
                clear: mockFn().mockResolvedValue(undefined),
            },
        } as unknown as TonWalletKitOptions;
        const kit = new TonWalletKit(options);
        await kit.waitForReady();
        return kit;
    };

    it('kit is ready and close', async () => {
        const kit = await createKit();
        expect(kit.isReady()).toBe(true);
        expect(kit.getStatus()).toEqual({ initialized: true, ready: true });
        await kit.close();
        expect(kit.isReady()).toBe(false);
        expect(kit.getStatus()).toEqual({ initialized: false, ready: false });
    });

    it('clearWallets removes all wallets', async () => {
        const kit = await createKit();
        await kit.addWallet(await createDummyWallet(1n));
        await kit.addWallet(await createDummyWallet(2n));
        // expect(kit.getWallets().length).toBe(2); // FIXME

        await kit.clearWallets();
        expect(kit.getWallets().length).toBe(0);
        await kit.close();
    });

    it('handleTonConnectUrl rejects invalid urls', async () => {
        const kit = await createKit();
        await expect(kit.handleTonConnectUrl('https://example.com')).rejects.toThrow();
        await kit.close();
    });

    it('processInjectedBridgeRequest returns void/undefined', async () => {
        const kit = await createKit();

        const result = await kit.processInjectedBridgeRequest(
            { method: 'noop' } as unknown as InjectedToExtensionBridgeRequest,
            undefined as unknown as InjectedToExtensionBridgeRequestPayload,
        );
        expect(result).toBeUndefined();
        await kit.close();
    });
});
