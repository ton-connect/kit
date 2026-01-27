/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock modules before imports
vi.mock('@ton/appkit', () => import('../__mocks__/@ton/appkit'));
vi.mock('@tonconnect/ui-react', () => import('../__mocks__/@tonconnect/ui-react'));

// Mock React hooks
vi.mock('react', async () => {
    const actual = await vi.importActual('react');
    return {
        ...actual,
        useEffect: vi.fn((fn) => fn()),
        useCallback: vi.fn((fn) => fn),
        useRef: vi.fn(() => ({ current: null })),
        useMemo: vi.fn((fn) => fn()),
        useState: vi.fn((initial) => [initial, vi.fn()]),
    };
});

describe('appkit react hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should export useAppKit hook', async () => {
        const { useAppKit, default: defaultExport } = await import('../appkit/react-hook');

        expect(useAppKit).toBeDefined();
        expect(typeof useAppKit).toBe('function');
        expect(defaultExport).toBe(useAppKit);
    });

    it('should return expected interface from useAppKit', async () => {
        const { useAppKit } = await import('../appkit/react-hook');

        const result = useAppKit();

        expect(result).toHaveProperty('isConnected');
        expect(result).toHaveProperty('address');
        expect(result).toHaveProperty('wallet');
        expect(result).toHaveProperty('disconnect');
        expect(typeof result.disconnect).toBe('function');
    });

    it('should call disconnect function', async () => {
        const { useAppKit } = await import('../appkit/react-hook');
        const { mockTonConnectUI } = await import('../__mocks__/@tonconnect/ui-react');

        const result = useAppKit();
        await result.disconnect();

        expect(mockTonConnectUI.disconnect).toHaveBeenCalled();
    });
});
