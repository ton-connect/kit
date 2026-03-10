/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from 'vitest';

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

        expect(url.origin + '/').toBe('https://agentic-wallets-dashboard.vercel.app/');
        expect(url.pathname).toBe('/create');
        expect(url.searchParams.get('operatorPublicKey')).toBe('0x1234');
        expect(url.searchParams.get('callbackUrl')).toBe('http://127.0.0.1:4567/agentic/callback/setup-1');
        expect(url.searchParams.get('agentName')).toBe('Alpha');
        expect(url.searchParams.get('source')).toBe('mcp');
        expect(url.searchParams.get('tonDeposit')).toBe('0.2');
    });

    it('builds dashboard links', () => {
        const url = new URL(buildAgenticDashboardLink('kQAgent'));
        expect(url.origin + '/').toBe('https://agentic-wallets-dashboard.vercel.app/');
        expect(url.pathname).toBe('/agent/kQAgent');
    });
});
