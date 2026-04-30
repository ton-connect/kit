/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { createWrapper } from '../../../__tests__/test-utils';
import { UseCustomProviderExample } from './use-custom-provider';

describe('Provider Hooks Examples', () => {
    let mockAppKit: any;

    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();

        mockAppKit = {
            emitter: { on: vi.fn(() => () => {}), off: vi.fn() },
            connectors: [],
            customProvidersManager: { getProvider: vi.fn().mockReturnValue(undefined) },
        };
    });

    afterEach(() => {
        cleanup();
    });

    describe('UseCustomProviderExample', () => {
        it('should show not registered message when provider is absent', () => {
            render(<UseCustomProviderExample />, { wrapper: createWrapper(mockAppKit) });
            expect(screen.getByText('TAC provider not registered')).toBeDefined();
        });

        it('should show ready message when provider is registered', () => {
            mockAppKit.customProvidersManager.getProvider = vi.fn().mockReturnValue({
                providerId: 'tac',
                type: 'custom',
                sendCrossChainTransaction: vi.fn(),
            });

            render(<UseCustomProviderExample />, { wrapper: createWrapper(mockAppKit) });
            expect(screen.getByText('TAC provider is ready')).toBeDefined();
        });
    });
});
