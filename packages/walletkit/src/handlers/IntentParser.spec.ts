/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect, beforeEach } from 'vitest';

import { IntentParser } from './IntentParser';

/**
 * Helper: Build a tc://intent_inline URL from a wire request object.
 * Encodes the request as base64url in the `r` parameter.
 */
function buildInlineUrl(
    clientId: string,
    request: Record<string, unknown>,
    opts?: { traceId?: string },
): string {
    const json = JSON.stringify(request);
    // base64url encode
    const b64 = Buffer.from(json, 'utf-8').toString('base64url');
    let url = `tc://intent_inline?id=${clientId}&r=${b64}`;
    if (opts?.traceId) url += `&trace_id=${opts.traceId}`;
    return url;
}

describe('IntentParser', () => {
    let parser: IntentParser;

    beforeEach(() => {
        parser = new IntentParser();
    });

    // ── isIntentUrl ──────────────────────────────────────────────────────────

    describe('isIntentUrl', () => {
        it('returns true for tc://intent_inline URLs', () => {
            expect(parser.isIntentUrl('tc://intent_inline?id=abc&r=data')).toBe(true);
        });

        it('returns true for tc://intent URLs', () => {
            expect(parser.isIntentUrl('tc://intent?id=abc&pk=key&get_url=http://example.com')).toBe(true);
        });

        it('is case-insensitive', () => {
            expect(parser.isIntentUrl('TC://INTENT_INLINE?id=abc')).toBe(true);
            expect(parser.isIntentUrl('  TC://INTENT?id=abc  ')).toBe(true);
        });

        it('returns false for non-intent URLs', () => {
            expect(parser.isIntentUrl('https://example.com')).toBe(false);
            expect(parser.isIntentUrl('tc://connect?id=abc')).toBe(false);
            expect(parser.isIntentUrl('')).toBe(false);
        });
    });

    // ── parse – inline txIntent ──────────────────────────────────────────────

    describe('parse – txIntent (inline)', () => {
        it('parses a transaction intent with TON items', async () => {
            const url = buildInlineUrl('client-123', {
                id: 'tx-1',
                m: 'txIntent',
                i: [
                    { t: 'ton', a: 'EQAddr1', am: '1000000000' },
                    { t: 'ton', a: 'EQAddr2', am: '2000000000', p: 'payload-b64' },
                ],
                vu: 1700000000,
                n: '-239',
            });

            const { event, connectRequest } = await parser.parse(url);

            expect(connectRequest).toBeUndefined();
            expect(event.type).toBe('transaction');

            if (event.type !== 'transaction') throw new Error('unexpected');
            const tx = event.value;

            expect(tx.id).toBe('tx-1');
            expect(tx.origin).toBe('deepLink');
            expect(tx.clientId).toBe('client-123');
            expect(tx.hasConnectRequest).toBe(false);
            expect(tx.deliveryMode).toBe('send');
            expect(tx.network).toEqual({ chainId: '-239' });
            expect(tx.validUntil).toBe(1700000000);
            expect(tx.items).toHaveLength(2);

            expect(tx.items[0].type).toBe('sendTon');
            if (tx.items[0].type === 'sendTon') {
                expect(tx.items[0].value.address).toBe('EQAddr1');
                expect(tx.items[0].value.amount).toBe('1000000000');
            }

            expect(tx.items[1].type).toBe('sendTon');
            if (tx.items[1].type === 'sendTon') {
                expect(tx.items[1].value.payload).toBe('payload-b64');
            }
        });

        it('parses signMsg as signOnly delivery mode', async () => {
            const url = buildInlineUrl('c1', {
                id: 'sm-1',
                m: 'signMsg',
                i: [{ t: 'ton', a: 'EQ1', am: '100' }],
            });

            const { event } = await parser.parse(url);
            expect(event.type).toBe('transaction');
            if (event.type === 'transaction') {
                expect(event.value.deliveryMode).toBe('signOnly');
            }
        });

        it('parses jetton items', async () => {
            const url = buildInlineUrl('c1', {
                id: 'j-1',
                m: 'txIntent',
                i: [
                    {
                        t: 'jetton',
                        ma: 'EQJettonMaster',
                        ja: '5000000',
                        d: 'EQDest',
                        rd: 'EQResp',
                        fta: '10000',
                        qi: 42,
                    },
                ],
            });

            const { event } = await parser.parse(url);
            expect(event.type).toBe('transaction');
            if (event.type === 'transaction') {
                const item = event.value.items[0];
                expect(item.type).toBe('sendJetton');
                if (item.type === 'sendJetton') {
                    expect(item.value.jettonMasterAddress).toBe('EQJettonMaster');
                    expect(item.value.jettonAmount).toBe('5000000');
                    expect(item.value.destination).toBe('EQDest');
                    expect(item.value.responseDestination).toBe('EQResp');
                    expect(item.value.forwardTonAmount).toBe('10000');
                    expect(item.value.queryId).toBe(42);
                }
            }
        });

        it('parses NFT items', async () => {
            const url = buildInlineUrl('c1', {
                id: 'n-1',
                m: 'txIntent',
                i: [
                    {
                        t: 'nft',
                        na: 'EQNftAddr',
                        no: 'EQNewOwner',
                        rd: 'EQResp',
                    },
                ],
            });

            const { event } = await parser.parse(url);
            expect(event.type).toBe('transaction');
            if (event.type === 'transaction') {
                const item = event.value.items[0];
                expect(item.type).toBe('sendNft');
                if (item.type === 'sendNft') {
                    expect(item.value.nftAddress).toBe('EQNftAddr');
                    expect(item.value.newOwnerAddress).toBe('EQNewOwner');
                    expect(item.value.responseDestination).toBe('EQResp');
                }
            }
        });

    });

    // ── parse – inline signIntent ────────────────────────────────────────────

    describe('parse – signIntent (inline)', () => {
        it('parses a text sign data intent', async () => {
            const url = buildInlineUrl('c1', {
                id: 'si-1',
                m: 'signIntent',
                mu: 'https://example.com/manifest.json',
                p: { type: 'text', text: 'Hello world' },
            });

            const { event } = await parser.parse(url);

            expect(event.type).toBe('signData');
            if (event.type === 'signData') {
                expect(event.value.id).toBe('si-1');
                expect(event.value.manifestUrl).toBe('https://example.com/manifest.json');
                expect(event.value.payload.data.type).toBe('text');
                if (event.value.payload.data.type === 'text') {
                    expect(event.value.payload.data.value.content).toBe('Hello world');
                }
            }
        });

        it('parses a binary sign data intent', async () => {
            const url = buildInlineUrl('c1', {
                id: 'si-2',
                m: 'signIntent',
                mu: 'https://example.com/manifest.json',
                p: { type: 'binary', bytes: 'AQID' },
            });

            const { event } = await parser.parse(url);
            if (event.type === 'signData') {
                expect(event.value.payload.data.type).toBe('binary');
                if (event.value.payload.data.type === 'binary') {
                    expect(event.value.payload.data.value.content).toBe('AQID');
                }
            }
        });

        it('parses a cell sign data intent', async () => {
            const url = buildInlineUrl('c1', {
                id: 'si-3',
                m: 'signIntent',
                mu: 'https://example.com/manifest.json',
                p: { type: 'cell', cell: 'te6cckEBAQEA', schema: 'MySchema' },
            });

            const { event } = await parser.parse(url);
            if (event.type === 'signData') {
                expect(event.value.payload.data.type).toBe('cell');
                if (event.value.payload.data.type === 'cell') {
                    expect(event.value.payload.data.value.content).toBe('te6cckEBAQEA');
                    expect(event.value.payload.data.value.schema).toBe('MySchema');
                }
            }
        });

        it('uses manifestUrl from connect request when mu is absent', async () => {
            const url = buildInlineUrl('c1', {
                id: 'si-4',
                m: 'signIntent',
                c: {
                    manifestUrl: 'https://dapp.com/manifest.json',
                    items: [{ name: 'ton_addr' }],
                },
                p: { type: 'text', text: 'Sign this' },
            });

            const { event, connectRequest } = await parser.parse(url);
            expect(connectRequest).toBeDefined();
            if (event.type === 'signData') {
                expect(event.value.manifestUrl).toBe('https://dapp.com/manifest.json');
                expect(event.value.hasConnectRequest).toBe(true);
            }
        });
    });

    // ── parse – inline actionIntent ──────────────────────────────────────────

    describe('parse – actionIntent (inline)', () => {
        it('parses an action intent', async () => {
            const url = buildInlineUrl('c1', {
                id: 'a-1',
                m: 'actionIntent',
                a: 'https://api.example.com/action',
            });

            const { event } = await parser.parse(url);
            expect(event.type).toBe('action');
            if (event.type === 'action') {
                expect(event.value.id).toBe('a-1');
                expect(event.value.actionUrl).toBe('https://api.example.com/action');
            }
        });
    });

    // ── parse – validation errors ────────────────────────────────────────────

    describe('parse – validation', () => {
        it('rejects URL without client ID', async () => {
            const json = JSON.stringify({ id: 'x', m: 'txIntent', i: [{ t: 'ton', a: 'A', am: '1' }] });
            const b64 = Buffer.from(json).toString('base64url');
            const url = `tc://intent_inline?r=${b64}`;

            await expect(parser.parse(url)).rejects.toThrow('Missing client ID');
        });

        it('rejects URL without payload', async () => {
            const url = 'tc://intent_inline?id=c1';
            await expect(parser.parse(url)).rejects.toThrow('Missing payload');
        });

        it('rejects unknown intent method', async () => {
            const url = buildInlineUrl('c1', { id: 'x', m: 'badMethod' });
            await expect(parser.parse(url)).rejects.toThrow('Invalid intent method');
        });

        it('rejects txIntent without items', async () => {
            const url = buildInlineUrl('c1', { id: 'x', m: 'txIntent' });
            await expect(parser.parse(url)).rejects.toThrow('missing items');
        });

        it('rejects txIntent with invalid item type', async () => {
            const url = buildInlineUrl('c1', { id: 'x', m: 'txIntent', i: [{ t: 'unknown' }] });
            await expect(parser.parse(url)).rejects.toThrow('Invalid intent item type');
        });

        it('rejects ton item missing address', async () => {
            const url = buildInlineUrl('c1', { id: 'x', m: 'txIntent', i: [{ t: 'ton', am: '100' }] });
            await expect(parser.parse(url)).rejects.toThrow('missing address');
        });

        it('rejects ton item missing amount', async () => {
            const url = buildInlineUrl('c1', { id: 'x', m: 'txIntent', i: [{ t: 'ton', a: 'A' }] });
            await expect(parser.parse(url)).rejects.toThrow('missing amount');
        });

        it('rejects jetton item missing master address', async () => {
            const url = buildInlineUrl('c1', {
                id: 'x',
                m: 'txIntent',
                i: [{ t: 'jetton', ja: '100', d: 'D' }],
            });
            await expect(parser.parse(url)).rejects.toThrow('missing master address');
        });

        it('rejects jetton item missing amount', async () => {
            const url = buildInlineUrl('c1', {
                id: 'x',
                m: 'txIntent',
                i: [{ t: 'jetton', ma: 'MA', d: 'D' }],
            });
            await expect(parser.parse(url)).rejects.toThrow('missing amount');
        });

        it('rejects jetton item missing destination', async () => {
            const url = buildInlineUrl('c1', {
                id: 'x',
                m: 'txIntent',
                i: [{ t: 'jetton', ma: 'MA', ja: '100' }],
            });
            await expect(parser.parse(url)).rejects.toThrow('missing destination');
        });

        it('rejects NFT item missing address', async () => {
            const url = buildInlineUrl('c1', {
                id: 'x',
                m: 'txIntent',
                i: [{ t: 'nft', no: 'NO' }],
            });
            await expect(parser.parse(url)).rejects.toThrow('missing address');
        });

        it('rejects NFT item missing new owner', async () => {
            const url = buildInlineUrl('c1', {
                id: 'x',
                m: 'txIntent',
                i: [{ t: 'nft', na: 'NA' }],
            });
            await expect(parser.parse(url)).rejects.toThrow('missing new owner');
        });

        it('rejects signIntent without manifest URL', async () => {
            const url = buildInlineUrl('c1', {
                id: 'x',
                m: 'signIntent',
                p: { type: 'text', text: 'hello' },
            });
            await expect(parser.parse(url)).rejects.toThrow('missing manifest URL');
        });

        it('rejects signIntent without payload', async () => {
            const url = buildInlineUrl('c1', {
                id: 'x',
                m: 'signIntent',
                mu: 'https://example.com/m.json',
            });
            await expect(parser.parse(url)).rejects.toThrow('missing payload');
        });

        it('rejects actionIntent without action URL', async () => {
            const url = buildInlineUrl('c1', { id: 'x', m: 'actionIntent' });
            await expect(parser.parse(url)).rejects.toThrow('missing action URL');
        });

        it('rejects request without id', async () => {
            const url = buildInlineUrl('c1', { m: 'txIntent', i: [{ t: 'ton', a: 'A', am: '1' }] });
            await expect(parser.parse(url)).rejects.toThrow('missing id');
        });

        it('rejects unsupported sign data type', async () => {
            const url = buildInlineUrl('c1', {
                id: 'x',
                m: 'signIntent',
                mu: 'https://example.com/m.json',
                p: { type: 'unsupported' },
            });
            await expect(parser.parse(url)).rejects.toThrow('Unsupported sign data type');
        });
    });

    // ── parseActionResponse ──────────────────────────────────────────────────

    describe('parseActionResponse', () => {
        const baseActionEvent = {
            id: 'a-1',
            origin: 'deepLink' as const,
            clientId: 'c1',
            hasConnectRequest: false,
            actionUrl: 'https://api.example.com/action',
        };

        it('parses sendTransaction action response', () => {
            const payload = {
                action_type: 'sendTransaction',
                action: {
                    messages: [
                        { address: 'EQAddr', amount: '500', payload: 'abc123' },
                    ],
                    valid_until: 1700000000,
                    network: '-239',
                },
            };

            const event = parser.parseActionResponse(payload, baseActionEvent);
            expect(event.type).toBe('transaction');
            if (event.type === 'transaction') {
                expect(event.value.resolvedTransaction).toBeDefined();
                expect(event.value.resolvedTransaction!.messages).toHaveLength(1);
                expect(event.value.resolvedTransaction!.messages[0].address).toBe('EQAddr');
                expect(event.value.resolvedTransaction!.messages[0].amount).toBe('500');
                expect(event.value.resolvedTransaction!.network).toEqual({ chainId: '-239' });
            }
        });

        it('parses signData action response', () => {
            const payload = {
                action_type: 'signData',
                action: {
                    type: 'text',
                    text: 'Sign this message',
                },
            };

            const event = parser.parseActionResponse(payload, baseActionEvent);
            expect(event.type).toBe('signData');
            if (event.type === 'signData') {
                expect(event.value.manifestUrl).toBe('https://api.example.com/action');
                expect(event.value.payload.data.type).toBe('text');
            }
        });

        it('rejects missing action_type', () => {
            expect(() => parser.parseActionResponse({ action: {} }, baseActionEvent)).toThrow(
                'missing action_type',
            );
        });

        it('rejects missing action', () => {
            expect(() => parser.parseActionResponse({ action_type: 'sendTransaction' }, baseActionEvent)).toThrow(
                'missing action_type or action',
            );
        });

        it('rejects unsupported action_type', () => {
            expect(() =>
                parser.parseActionResponse(
                    { action_type: 'unknown', action: {} },
                    baseActionEvent,
                ),
            ).toThrow('unsupported action_type');
        });

        it('rejects sendTransaction without messages', () => {
            expect(() =>
                parser.parseActionResponse(
                    { action_type: 'sendTransaction', action: { messages: [] } },
                    baseActionEvent,
                ),
            ).toThrow('missing messages');
        });

        it('rejects signData without type', () => {
            expect(() =>
                parser.parseActionResponse(
                    { action_type: 'signData', action: { text: 'hello' } },
                    baseActionEvent,
                ),
            ).toThrow('missing type');
        });
    });

});
