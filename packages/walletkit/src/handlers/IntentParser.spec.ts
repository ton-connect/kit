/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import nacl from 'tweetnacl';

import { IntentParser, isIntentUrl } from './IntentParser';

/**
 * Helper: Build a tc://?m=intent URL from a spec-format request object.
 * Encodes the request as base64url in the `mp` parameter.
 * Pass `connectRequest` to add it as the `r` URL parameter.
 */
function buildInlineUrl(
    clientId: string,
    request: Record<string, unknown>,
    opts?: { traceId?: string; connectRequest?: Record<string, unknown> },
): string {
    const json = JSON.stringify(request);
    const b64 = Buffer.from(json, 'utf-8').toString('base64url');
    let url = `tc://?m=intent&id=${clientId}&mp=${b64}`;
    if (opts?.traceId) url += `&trace_id=${opts.traceId}`;
    if (opts?.connectRequest) url += `&r=${encodeURIComponent(JSON.stringify(opts.connectRequest))}`;
    return url;
}

/**
 * Helper: Build a tc://?m=intent_remote URL for object-storage intent tests.
 */
function buildObjectStorageUrl(clientId: string, privateKeyHex: string, getUrl: string): string {
    return `tc://?m=intent_remote&id=${clientId}&pk=${privateKeyHex}&get_url=${encodeURIComponent(getUrl)}`;
}

/** Convert a Uint8Array to a lowercase hex string. */
const toHex = (b: Uint8Array) =>
    Array.from(b)
        .map((x) => x.toString(16).padStart(2, '0'))
        .join('');

/**
 * Encrypt a payload using the SDK self-encryption scheme:
 *   nacl.box(payload, nonce, ownPublicKey, ownSecretKey)
 * The result is nonce (24 bytes) || ciphertext, matching what decryptPayload expects.
 */
function encryptForSelf(payload: Record<string, unknown>, kp: { publicKey: Uint8Array; secretKey: Uint8Array }): Uint8Array {
    const nonce = nacl.randomBytes(24);
    const ciphertext = nacl.box(new TextEncoder().encode(JSON.stringify(payload)), nonce, kp.publicKey, kp.secretKey);
    const encrypted = new Uint8Array(nonce.length + ciphertext.length);
    encrypted.set(nonce);
    encrypted.set(ciphertext, nonce.length);
    return encrypted;
}

describe('IntentParser', () => {
    let parser: IntentParser;

    beforeEach(() => {
        parser = new IntentParser();
    });

    // ── isIntentUrl ──────────────────────────────────────────────────────────

    describe('isIntentUrl', () => {
        it('returns true for m=intent URLs', () => {
            expect(isIntentUrl('tc://?m=intent&id=abc&mp=data')).toBe(true);
        });

        it('returns true for m=intent_remote URLs', () => {
            expect(isIntentUrl('tc://?m=intent_remote&id=abc&pk=key&get_url=http://example.com')).toBe(true);
        });

        it('is case-insensitive', () => {
            expect(isIntentUrl('TC://?M=INTENT&id=abc')).toBe(true);
            expect(isIntentUrl('  TC://?M=INTENT_REMOTE&id=abc  ')).toBe(true);
        });

        it('accepts https universal link scheme with m=intent', () => {
            const url = 'https://wallet.example.com/ton-connect?v=2&id=abc&m=intent&mp=data';
            expect(isIntentUrl(url)).toBe(true);
        });

        it('returns false for non-intent URLs', () => {
            expect(isIntentUrl('https://example.com')).toBe(false);
            expect(isIntentUrl('tc://?m=connect&id=abc')).toBe(false);
            expect(isIntentUrl('')).toBe(false);
        });
    });

    // ── parse – inline txDraft ──────────────────────────────────────────────

    describe('parse – txDraft (inline)', () => {
        it('parses a transaction intent with TON items', async () => {
            const url = buildInlineUrl('client-123', {
                id: 'tx-1',
                method: 'txDraft',
                params: {
                    vu: 1700000000,
                    n: '-239',
                    i: [
                        { t: 'ton', a: 'EQAddr1', am: '1000000000' },
                        { t: 'ton', a: 'EQAddr2', am: '2000000000', p: 'payload-b64' },
                    ],
                },
            });

            const { event, connectRequest } = await parser.parse(url);

            expect(connectRequest).toBeUndefined();
            expect(event.type).toBe('transaction');

            if (event.type !== 'transaction') throw new Error('unexpected');
            const tx = event;

            expect(tx.id).toBe('tx-1');
            expect(tx.origin).toBe('deepLink');
            expect(tx.clientId).toBe('client-123');
            expect(tx.deliveryMode).toBe('send');
            expect(tx.network).toEqual({ chainId: '-239' });
            expect(tx.validUntil).toBe(1700000000);
            expect(tx.items).toHaveLength(2);

            expect(tx.items[0].type).toBe('sendTon');
            if (tx.items[0].type === 'sendTon') {
                expect(tx.items[0].address).toBe('EQAddr1');
                expect(tx.items[0].amount).toBe('1000000000');
            }

            expect(tx.items[1].type).toBe('sendTon');
            if (tx.items[1].type === 'sendTon') {
                expect(tx.items[1].payload).toBe('payload-b64');
            }
        });

        it('parses signMsgDraft as signOnly delivery mode', async () => {
            const url = buildInlineUrl('c1', {
                id: 'sm-1',
                method: 'signMsgDraft',
                params: {
                    i: [{ t: 'ton', a: 'EQ1', am: '100' }],
                },
            });

            const { event } = await parser.parse(url);
            expect(event.type).toBe('transaction');
            if (event.type === 'transaction') {
                expect(event.deliveryMode).toBe('signOnly');
            }
        });

        it('parses jetton items', async () => {
            const url = buildInlineUrl('c1', {
                id: 'j-1',
                method: 'txDraft',
                params: {
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
                },
            });

            const { event } = await parser.parse(url);
            expect(event.type).toBe('transaction');
            if (event.type === 'transaction') {
                const item = event.items[0];
                expect(item.type).toBe('sendJetton');
                if (item.type === 'sendJetton') {
                    expect(item.jettonMasterAddress).toBe('EQJettonMaster');
                    expect(item.jettonAmount).toBe('5000000');
                    expect(item.destination).toBe('EQDest');
                    expect(item.responseDestination).toBe('EQResp');
                    expect(item.forwardTonAmount).toBe('10000');
                    expect(item.queryId).toBe(42);
                }
            }
        });

        it('parses NFT items', async () => {
            const url = buildInlineUrl('c1', {
                id: 'n-1',
                method: 'txDraft',
                params: {
                    i: [
                        {
                            t: 'nft',
                            na: 'EQNftAddr',
                            no: 'EQNewOwner',
                            rd: 'EQResp',
                        },
                    ],
                },
            });

            const { event } = await parser.parse(url);
            expect(event.type).toBe('transaction');
            if (event.type === 'transaction') {
                const item = event.items[0];
                expect(item.type).toBe('sendNft');
                if (item.type === 'sendNft') {
                    expect(item.nftAddress).toBe('EQNftAddr');
                    expect(item.newOwnerAddress).toBe('EQNewOwner');
                    expect(item.responseDestination).toBe('EQResp');
                }
            }
        });
    });

    // ── parse – inline signData ────────────────────────────────────────────

    describe('parse – signData (inline)', () => {
        it('parses a text sign data intent', async () => {
            const url = buildInlineUrl(
                'c1',
                {
                    id: 'si-1',
                    method: 'signData',
                    params: [JSON.stringify({ type: 'text', text: 'Hello world' })],
                },
                { connectRequest: { manifestUrl: 'https://example.com/manifest.json', items: [] } },
            );

            const { event } = await parser.parse(url);

            expect(event.type).toBe('signData');
            if (event.type === 'signData') {
                expect(event.id).toBe('si-1');
                expect(event.manifestUrl).toBe('https://example.com/manifest.json');
                expect(event.payload.data.type).toBe('text');
                if (event.payload.data.type === 'text') {
                    expect(event.payload.data.value.content).toBe('Hello world');
                }
            }
        });

        it('parses a binary sign data intent', async () => {
            const url = buildInlineUrl(
                'c1',
                {
                    id: 'si-2',
                    method: 'signData',
                    params: [JSON.stringify({ type: 'binary', bytes: 'AQID' })],
                },
                { connectRequest: { manifestUrl: 'https://example.com/manifest.json', items: [] } },
            );

            const { event } = await parser.parse(url);
            if (event.type === 'signData') {
                expect(event.payload.data.type).toBe('binary');
                if (event.payload.data.type === 'binary') {
                    expect(event.payload.data.value.content).toBe('AQID');
                }
            }
        });

        it('parses a cell sign data intent', async () => {
            const url = buildInlineUrl(
                'c1',
                {
                    id: 'si-3',
                    method: 'signData',
                    params: [JSON.stringify({ type: 'cell', cell: 'te6cckEBAQEA', schema: 'MySchema' })],
                },
                { connectRequest: { manifestUrl: 'https://example.com/manifest.json', items: [] } },
            );

            const { event } = await parser.parse(url);
            if (event.type === 'signData') {
                expect(event.payload.data.type).toBe('cell');
                if (event.payload.data.type === 'cell') {
                    expect(event.payload.data.value.content).toBe('te6cckEBAQEA');
                    expect(event.payload.data.value.schema).toBe('MySchema');
                }
            }
        });

        it('uses manifestUrl from connect request when present', async () => {
            const url = buildInlineUrl(
                'c1',
                {
                    id: 'si-4',
                    method: 'signData',
                    params: [JSON.stringify({ type: 'text', text: 'Sign this' })],
                },
                { connectRequest: { manifestUrl: 'https://dapp.com/manifest.json', items: [{ name: 'ton_addr' }] } },
            );

            const { event, connectRequest } = await parser.parse(url);
            expect(connectRequest).toBeDefined();
            if (event.type === 'signData') {
                expect(event.manifestUrl).toBe('https://dapp.com/manifest.json');
            }
        });
    });

    // ── parse – inline actionDraft ──────────────────────────────────────────

    describe('parse – actionDraft (inline)', () => {
        it('parses an action intent', async () => {
            const url = buildInlineUrl('c1', {
                id: 'a-1',
                method: 'actionDraft',
                params: { url: 'https://api.example.com/action' },
            });

            const { event } = await parser.parse(url);
            expect(event.type).toBe('action');
            if (event.type === 'action') {
                expect(event.id).toBe('a-1');
                expect(event.actionUrl).toBe('https://api.example.com/action');
            }
        });
    });

    // ── parse – validation errors ────────────────────────────────────────────

    describe('parse – validation', () => {
        it('allows inline URL without client ID (fire-and-forget)', async () => {
            const json = JSON.stringify({
                id: 'x',
                method: 'txDraft',
                params: { i: [{ t: 'ton', a: 'A', am: '1' }] },
            });
            const b64 = Buffer.from(json).toString('base64url');
            const url = `tc://?m=intent&mp=${b64}`;

            const { event } = await parser.parse(url);
            expect(event.type).toBe('transaction');
            expect(event.clientId).toBeUndefined();
        });

        it('rejects object storage URL without client ID', async () => {
            const url = 'tc://?m=intent_remote&pk=abc123&get_url=https%3A%2F%2Fexample.com%2Fpayload';
            await expect(parser.parse(url)).rejects.toThrow('Missing client ID');
        });

        it('decrypts object storage payload using SDK self-encryption scheme', async () => {
            // Reproduce the SDK's encryption scheme:
            //   const sessionCrypto = new SessionCrypto();
            //   sessionCrypto.encrypt(payload, sessionCrypto.publicKey)
            // which is: nacl.box(payload, randomNonce, ownPub, ownSec) || nonce prepended
            const ephemeral = nacl.box.keyPair();
            const toHex = (b: Uint8Array) =>
                Array.from(b)
                    .map((x) => x.toString(16).padStart(2, '0'))
                    .join('');

            const payload = {
                id: 'os-1',
                method: 'txDraft',
                params: { i: [{ t: 'ton', a: 'EQAddr1', am: '500000000' }] },
            };
            const nonce = nacl.randomBytes(24);
            const ciphertext = nacl.box(
                new TextEncoder().encode(JSON.stringify(payload)),
                nonce,
                ephemeral.publicKey, // self-encrypt: receiverPub = own pub
                ephemeral.secretKey,
            );
            const encrypted = new Uint8Array(nonce.length + ciphertext.length);
            encrypted.set(nonce);
            encrypted.set(ciphertext, nonce.length);

            const encryptedB64 = Buffer.from(encrypted).toString('base64');
            const getUrl = 'https://storage.example.com/payload';

            vi.stubGlobal(
                'fetch',
                vi.fn().mockResolvedValue({
                    ok: true,
                    headers: { get: () => 'text/plain' },
                    arrayBuffer: async () => new TextEncoder().encode(encryptedB64).buffer,
                }),
            );

            const clientId = toHex(nacl.box.keyPair().publicKey); // existing session id — not used for decrypt
            const pk = toHex(ephemeral.secretKey);
            const url = `tc://?m=intent_remote&id=${clientId}&pk=${pk}&get_url=${encodeURIComponent(getUrl)}`;

            const { event } = await parser.parse(url);
            expect(event.type).toBe('transaction');

            vi.unstubAllGlobals();
        });

        it('rejects URL without payload', async () => {
            const url = 'tc://?m=intent&id=c1';
            await expect(parser.parse(url)).rejects.toThrow('Missing payload');
        });

        it('rejects unknown intent method', async () => {
            const url = buildInlineUrl('c1', { id: 'x', method: 'badMethod' });
            await expect(parser.parse(url)).rejects.toThrow('Invalid intent method');
        });

        it('rejects txDraft without items', async () => {
            const url = buildInlineUrl('c1', { id: 'x', method: 'txDraft', params: {} });
            await expect(parser.parse(url)).rejects.toThrow('missing items');
        });

        it('rejects txDraft with invalid item type', async () => {
            const url = buildInlineUrl('c1', { id: 'x', method: 'txDraft', params: { i: [{ t: 'unknown' }] } });
            await expect(parser.parse(url)).rejects.toThrow('Invalid intent item type');
        });

        it('rejects ton item missing address', async () => {
            const url = buildInlineUrl('c1', {
                id: 'x',
                method: 'txDraft',
                params: { i: [{ t: 'ton', am: '100' }] },
            });
            await expect(parser.parse(url)).rejects.toThrow('missing address');
        });

        it('rejects ton item missing amount', async () => {
            const url = buildInlineUrl('c1', {
                id: 'x',
                method: 'txDraft',
                params: { i: [{ t: 'ton', a: 'A' }] },
            });
            await expect(parser.parse(url)).rejects.toThrow('missing amount');
        });

        it('rejects jetton item missing master address', async () => {
            const url = buildInlineUrl('c1', {
                id: 'x',
                method: 'txDraft',
                params: { i: [{ t: 'jetton', ja: '100', d: 'D' }] },
            });
            await expect(parser.parse(url)).rejects.toThrow('missing master address');
        });

        it('rejects jetton item missing amount', async () => {
            const url = buildInlineUrl('c1', {
                id: 'x',
                method: 'txDraft',
                params: { i: [{ t: 'jetton', ma: 'MA', d: 'D' }] },
            });
            await expect(parser.parse(url)).rejects.toThrow('missing amount');
        });

        it('rejects jetton item missing destination', async () => {
            const url = buildInlineUrl('c1', {
                id: 'x',
                method: 'txDraft',
                params: { i: [{ t: 'jetton', ma: 'MA', ja: '100' }] },
            });
            await expect(parser.parse(url)).rejects.toThrow('missing destination');
        });

        it('rejects NFT item missing address', async () => {
            const url = buildInlineUrl('c1', {
                id: 'x',
                method: 'txDraft',
                params: { i: [{ t: 'nft', no: 'NO' }] },
            });
            await expect(parser.parse(url)).rejects.toThrow('missing address');
        });

        it('rejects NFT item missing new owner', async () => {
            const url = buildInlineUrl('c1', {
                id: 'x',
                method: 'txDraft',
                params: { i: [{ t: 'nft', na: 'NA' }] },
            });
            await expect(parser.parse(url)).rejects.toThrow('missing new owner');
        });

        it('rejects signData without payload', async () => {
            const url = buildInlineUrl('c1', {
                id: 'x',
                method: 'signData',
            });
            await expect(parser.parse(url)).rejects.toThrow('missing payload');
        });

        it('rejects actionDraft without action URL', async () => {
            const url = buildInlineUrl('c1', { id: 'x', method: 'actionDraft', params: {} });
            await expect(parser.parse(url)).rejects.toThrow('missing url');
        });

        it('rejects request without id', async () => {
            const url = buildInlineUrl('c1', {
                method: 'txDraft',
                params: { i: [{ t: 'ton', a: 'A', am: '1' }] },
            });
            await expect(parser.parse(url)).rejects.toThrow('missing id');
        });

        it('rejects unsupported sign data type', async () => {
            const url = buildInlineUrl('c1', {
                id: 'x',
                method: 'signData',
                params: [JSON.stringify({ type: 'unsupported' })],
            });
            await expect(parser.parse(url)).rejects.toThrow('Unsupported sign data type');
        });
    });

    // ── parse – object storage (intent_remote) ───────────────────────────────

    describe('parse – object storage (intent_remote)', () => {
        afterEach(() => {
            vi.unstubAllGlobals();
        });

        it('parses raw-bytes (non-text) response from object storage', async () => {
            const kp = nacl.box.keyPair();
            const payload = { id: 'os-raw', method: 'txDraft', params: { i: [{ t: 'ton', a: 'EQAddr', am: '100' }] } };
            const encrypted = encryptForSelf(payload, kp);

            vi.stubGlobal(
                'fetch',
                vi.fn().mockResolvedValue({
                    ok: true,
                    headers: { get: () => 'application/octet-stream' },
                    arrayBuffer: async () => encrypted.buffer,
                }),
            );

            const url = buildObjectStorageUrl(toHex(kp.publicKey), toHex(kp.secretKey), 'https://storage.example.com/payload');
            const { event } = await parser.parse(url);
            expect(event.type).toBe('transaction');
        });

        it('throws on HTTP error from object storage', async () => {
            vi.stubGlobal(
                'fetch',
                vi.fn().mockResolvedValue({
                    ok: false,
                    status: 404,
                    statusText: 'Not Found',
                }),
            );

            const kp = nacl.box.keyPair();
            const url = buildObjectStorageUrl(toHex(kp.publicKey), toHex(kp.secretKey), 'https://storage.example.com/missing');
            await expect(parser.parse(url)).rejects.toThrow('Object storage fetch failed');
        });

        it('throws on network error fetching object storage', async () => {
            vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

            const kp = nacl.box.keyPair();
            const url = buildObjectStorageUrl(toHex(kp.publicKey), toHex(kp.secretKey), 'https://storage.example.com/payload');
            await expect(parser.parse(url)).rejects.toThrow('Failed to fetch intent payload');
        });

        it('throws when payload is too short (≤24 bytes) to contain nonce', async () => {
            const shortData = new Uint8Array(10);
            vi.stubGlobal(
                'fetch',
                vi.fn().mockResolvedValue({
                    ok: true,
                    headers: { get: () => 'application/octet-stream' },
                    arrayBuffer: async () => shortData.buffer,
                }),
            );

            const kp = nacl.box.keyPair();
            const url = buildObjectStorageUrl(toHex(kp.publicKey), toHex(kp.secretKey), 'https://storage.example.com/short');
            await expect(parser.parse(url)).rejects.toThrow('Encrypted payload too short');
        });

        it('throws on invalid private key length in pk param', async () => {
            const kp = nacl.box.keyPair();
            const payload = { id: 'x', method: 'txDraft', params: { i: [{ t: 'ton', a: 'A', am: '1' }] } };
            const encrypted = encryptForSelf(payload, kp);

            vi.stubGlobal(
                'fetch',
                vi.fn().mockResolvedValue({
                    ok: true,
                    headers: { get: () => 'application/octet-stream' },
                    arrayBuffer: async () => encrypted.buffer,
                }),
            );

            // 'aabbccdd' decodes to 4 bytes — not a valid 32-byte NaCl secret key
            const url = buildObjectStorageUrl(toHex(kp.publicKey), 'aabbccdd', 'https://storage.example.com/payload');
            await expect(parser.parse(url)).rejects.toThrow('Invalid wallet private key length');
        });

        it('throws when decryption fails due to wrong key', async () => {
            const encryptKp = nacl.box.keyPair();
            const wrongKp = nacl.box.keyPair();
            const payload = { id: 'x', method: 'txDraft', params: { i: [{ t: 'ton', a: 'A', am: '1' }] } };
            const encrypted = encryptForSelf(payload, encryptKp);

            vi.stubGlobal(
                'fetch',
                vi.fn().mockResolvedValue({
                    ok: true,
                    headers: { get: () => 'application/octet-stream' },
                    arrayBuffer: async () => encrypted.buffer,
                }),
            );

            // Pass the wrong secret key — decryption will fail
            const url = buildObjectStorageUrl(toHex(encryptKp.publicKey), toHex(wrongKp.secretKey), 'https://storage.example.com/payload');
            await expect(parser.parse(url)).rejects.toThrow('Failed to decrypt intent payload');
        });

        it('throws on missing pk param in intent_remote URL', async () => {
            const kp = nacl.box.keyPair();
            const url = `tc://?m=intent_remote&id=${toHex(kp.publicKey)}&get_url=https%3A%2F%2Fexample.com%2Fpayload`;
            await expect(parser.parse(url)).rejects.toThrow('Missing wallet private key');
        });

        it('throws on missing get_url param in intent_remote URL', async () => {
            const kp = nacl.box.keyPair();
            const url = `tc://?m=intent_remote&id=${toHex(kp.publicKey)}&pk=${toHex(kp.secretKey)}`;
            await expect(parser.parse(url)).rejects.toThrow('Missing get_url');
        });
    });

    // ── parseActionResponse ──────────────────────────────────────────────────

    describe('parseActionResponse', () => {
        const baseActionEvent = {
            type: 'action' as const,
            id: 'a-1',
            origin: 'deepLink' as const,
            clientId: 'c1',
            actionUrl: 'https://api.example.com/action',
        };

        it('parses sendTransaction action response', () => {
            const payload = {
                action_type: 'sendTransaction',
                action: {
                    messages: [{ address: 'EQAddr', amount: '500', payload: 'abc123' }],
                    valid_until: 1700000000,
                    network: '-239',
                },
            };

            const event = parser.parseActionResponse(payload, baseActionEvent);
            expect(event.type).toBe('transaction');
            if (event.type === 'transaction') {
                expect(event.resolvedTransaction).toBeDefined();
                expect(event.resolvedTransaction!.messages).toHaveLength(1);
                expect(event.resolvedTransaction!.messages[0].address).toBe('EQAddr');
                expect(event.resolvedTransaction!.messages[0].amount).toBe('500');
                expect(event.resolvedTransaction!.network).toEqual({ chainId: '-239' });
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
                expect(event.manifestUrl).toBe('https://api.example.com/action');
                expect(event.payload.data.type).toBe('text');
            }
        });

        it('rejects missing action_type', () => {
            expect(() => parser.parseActionResponse({ action: {} }, baseActionEvent)).toThrow('missing action_type');
        });

        it('rejects missing action', () => {
            expect(() => parser.parseActionResponse({ action_type: 'sendTransaction' }, baseActionEvent)).toThrow(
                'missing action_type or action',
            );
        });

        it('rejects unsupported action_type', () => {
            expect(() => parser.parseActionResponse({ action_type: 'unknown', action: {} }, baseActionEvent)).toThrow(
                'unsupported action_type',
            );
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
                parser.parseActionResponse({ action_type: 'signData', action: { text: 'hello' } }, baseActionEvent),
            ).toThrow('missing type');
        });
    });
});
