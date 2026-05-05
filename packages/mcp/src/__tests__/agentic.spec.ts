/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from 'vitest';
import { ParseBase64 } from '@ton/walletkit';

import { buildAgenticCreateDeepLink, buildAgenticDashboardLink } from '../utils/agentic.js';

describe('mcp agentic helpers', () => {
    it('builds create deeplinks for dashboard flow', () => {
        const url = new URL(
            buildAgenticCreateDeepLink({
                operatorPublicKey: '0x1234',
                callbackUrl: 'http://127.0.0.1:4567/agentic/callback/setup-1',
                agentName: 'Alpha',
                source: 'mcp',
                tonDeposit: '0.2',
            }),
        );

        expect(url.origin + '/').toBe('https://agents.ton.org/');
        expect(url.pathname).toBe('/create');
        expect(url.searchParams.has('operatorPublicKey')).toBe(false);
        expect(url.searchParams.has('callbackUrl')).toBe(false);

        const encodedPayload = url.searchParams.get('data');
        expect(encodedPayload).toBeTruthy();

        const payload = JSON.parse(ParseBase64(encodedPayload!));
        expect(payload).toEqual({
            originOperatorPublicKey: '0x1234',
            callbackUrl: 'http://127.0.0.1:4567/agentic/callback/setup-1',
            agentName: 'Alpha',
            source: 'mcp',
            tonDeposit: '0.2',
        });
    });

    it('builds dashboard links', () => {
        const url = new URL(buildAgenticDashboardLink('kQAgent'));
        expect(url.origin + '/').toBe('https://agents.ton.org/');
        expect(url.pathname).toBe('/agent/kQAgent');
    });
});
