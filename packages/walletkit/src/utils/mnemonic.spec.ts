/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { MnemonicToKeyPair, CreateTonMnemonic } from './mnemonic';
import { WalletKitError, ERROR_CODES } from '../errors';

const TON_MNEMONIC_PUBLIC_KEY = Uint8Array.from(
    Buffer.from('2fea08c108702b69531fc793953466e690f2076c64c0393948aae4177dd2a9f5', 'hex'),
);
const TON_MNEMONIC_SECRET_KEY = Uint8Array.from(
    Buffer.from('0e5d1af976fc42954764144d47f6a4d38e1b753a22fda8173be659edddfd00ed', 'hex'),
);

const BIP39_MNEMONIC_PUBLIC_KEY = Uint8Array.from(
    Buffer.from('d2ce1d2618ee59ecdcc2b55b9f05b2eea8729e98a49306b1a04c6510074ecc9f', 'hex'),
);
const BIP39_MNEMONIC_SECRET_KEY = Uint8Array.from(
    Buffer.from('098cb1f3427de537ea4a4ef682e54d8cdd69d0f51ddb37f7f2ae48ffa1445ea1', 'hex'),
);
// Valid 24-word TON mnemonic for testing
const VALID_TON_MNEMONIC_24 = [
    'abandon',
    'abandon',
    'abandon',
    'abandon',
    'abandon',
    'abandon',
    'abandon',
    'abandon',
    'abandon',
    'abandon',
    'abandon',
    'abandon',
    'abandon',
    'abandon',
    'abandon',
    'abandon',
    'abandon',
    'abandon',
    'abandon',
    'abandon',
    'abandon',
    'abandon',
    'abandon',
    'about',
];

// Valid 12-word mnemonic for testing
const VALID_MNEMONIC_12 = [
    'abandon',
    'abandon',
    'abandon',
    'abandon',
    'abandon',
    'abandon',
    'abandon',
    'abandon',
    'abandon',
    'abandon',
    'abandon',
    'about',
];

describe('mnemonic', () => {
    describe('MnemonicToKeyPair', () => {
        describe('with TON mnemonic type', () => {
            it('should convert 24-word mnemonic array to key pair', async () => {
                const result = await MnemonicToKeyPair(VALID_TON_MNEMONIC_24, 'ton');

                expect(result.publicKey).toBeInstanceOf(Uint8Array);
                expect(result.secretKey).toBeInstanceOf(Uint8Array);
                expect(result.publicKey.length).toBe(32);
                expect(result.secretKey.length).toBe(64);
                expect(result.publicKey).toEqual(TON_MNEMONIC_PUBLIC_KEY);
                expect(result.secretKey.slice(0, 32)).toEqual(TON_MNEMONIC_SECRET_KEY);
            });

            it('should convert 24-word mnemonic string to key pair', async () => {
                const mnemonicString = VALID_TON_MNEMONIC_24.join(' ');
                const result = await MnemonicToKeyPair(mnemonicString, 'ton');

                expect(result.publicKey).toBeInstanceOf(Uint8Array);
                expect(result.secretKey).toBeInstanceOf(Uint8Array);
                expect(result.publicKey.length).toBe(32);
                expect(result.secretKey.length).toBe(64);
            });

            it('should use TON type by default', async () => {
                const resultWithType = await MnemonicToKeyPair(VALID_TON_MNEMONIC_24, 'ton');
                const resultDefault = await MnemonicToKeyPair(VALID_TON_MNEMONIC_24);

                expect(resultWithType.publicKey).toEqual(resultDefault.publicKey);
                expect(resultWithType.secretKey).toEqual(resultDefault.secretKey);
                expect(resultWithType.publicKey).toEqual(TON_MNEMONIC_PUBLIC_KEY);
                expect(resultWithType.secretKey.slice(0, 32)).toEqual(TON_MNEMONIC_SECRET_KEY);
            });

            it('should produce deterministic results for same mnemonic', async () => {
                const result1 = await MnemonicToKeyPair(VALID_TON_MNEMONIC_24, 'ton');
                const result2 = await MnemonicToKeyPair(VALID_TON_MNEMONIC_24, 'ton');

                expect(result1.publicKey).toEqual(result2.publicKey);
                expect(result1.secretKey).toEqual(result2.secretKey);
            });

            it('should produce different keys for different mnemonics', async () => {
                const mnemonic1 = [...VALID_TON_MNEMONIC_24];
                const mnemonic2 = [...VALID_TON_MNEMONIC_24];
                mnemonic2[0] = 'ability';

                const result1 = await MnemonicToKeyPair(mnemonic1, 'ton');
                const result2 = await MnemonicToKeyPair(mnemonic2, 'ton');

                expect(Buffer.from(result1.publicKey).equals(Buffer.from(result2.publicKey))).toBe(false);
            });
        });

        describe('with BIP39 mnemonic type', () => {
            it('should convert 24-word mnemonic array to key pair', async () => {
                const result = await MnemonicToKeyPair(VALID_TON_MNEMONIC_24, 'bip39');

                expect(result.publicKey).toBeInstanceOf(Uint8Array);
                expect(result.secretKey).toBeInstanceOf(Uint8Array);
                expect(result.publicKey.length).toBe(32);
                expect(result.secretKey.length).toBe(64);
                expect(result.publicKey).toEqual(BIP39_MNEMONIC_PUBLIC_KEY);
                expect(result.secretKey.slice(0, 32)).toEqual(BIP39_MNEMONIC_SECRET_KEY);
            });

            it('should convert 24-word mnemonic string to key pair', async () => {
                const mnemonicString = VALID_TON_MNEMONIC_24.join(' ');
                const result = await MnemonicToKeyPair(mnemonicString, 'bip39');

                expect(result.publicKey).toBeInstanceOf(Uint8Array);
                expect(result.secretKey).toBeInstanceOf(Uint8Array);
                expect(result.publicKey.length).toBe(32);
                expect(result.secretKey.length).toBe(64);
                expect(result.publicKey).toEqual(BIP39_MNEMONIC_PUBLIC_KEY);
                expect(result.secretKey.slice(0, 32)).toEqual(BIP39_MNEMONIC_SECRET_KEY);
            });

            it('should convert 12-word mnemonic to key pair', async () => {
                const result = await MnemonicToKeyPair(VALID_MNEMONIC_12, 'bip39');

                expect(result.publicKey).toBeInstanceOf(Uint8Array);
                expect(result.secretKey).toBeInstanceOf(Uint8Array);
                expect(result.publicKey.length).toBe(32);
                expect(result.secretKey.length).toBe(64);
            });

            it('should produce deterministic results for same mnemonic', async () => {
                const result1 = await MnemonicToKeyPair(VALID_TON_MNEMONIC_24, 'bip39');
                const result2 = await MnemonicToKeyPair(VALID_TON_MNEMONIC_24, 'bip39');

                expect(result1.publicKey).toEqual(result2.publicKey);
                expect(result1.secretKey).toEqual(result2.secretKey);
            });

            it('should produce different keys than TON type for same mnemonic', async () => {
                const resultTon = await MnemonicToKeyPair(VALID_TON_MNEMONIC_24, 'ton');
                const resultBip39 = await MnemonicToKeyPair(VALID_TON_MNEMONIC_24, 'bip39');

                expect(Buffer.from(resultTon.publicKey).equals(Buffer.from(resultBip39.publicKey))).toBe(false);
            });
        });

        describe('error handling', () => {
            it('should throw error for mnemonic with less than 12 words', async () => {
                const shortMnemonic = ['abandon', 'abandon', 'abandon', 'abandon', 'abandon'];

                await expect(MnemonicToKeyPair(shortMnemonic)).rejects.toThrow(WalletKitError);
                await expect(MnemonicToKeyPair(shortMnemonic)).rejects.toMatchObject({
                    code: ERROR_CODES.VALIDATION_ERROR,
                });
            });

            it('should throw error for mnemonic with 15 words', async () => {
                const invalidLengthMnemonic = new Array(15).fill('abandon');

                await expect(MnemonicToKeyPair(invalidLengthMnemonic)).rejects.toThrow(WalletKitError);
                await expect(MnemonicToKeyPair(invalidLengthMnemonic)).rejects.toMatchObject({
                    code: ERROR_CODES.VALIDATION_ERROR,
                });
            });

            it('should throw error for mnemonic with more than 24 words', async () => {
                const longMnemonic = new Array(30).fill('abandon');

                await expect(MnemonicToKeyPair(longMnemonic)).rejects.toThrow(WalletKitError);
                await expect(MnemonicToKeyPair(longMnemonic)).rejects.toMatchObject({
                    code: ERROR_CODES.VALIDATION_ERROR,
                });
            });

            it('should throw error for empty mnemonic', async () => {
                await expect(MnemonicToKeyPair([])).rejects.toThrow(WalletKitError);
                await expect(MnemonicToKeyPair([])).rejects.toMatchObject({
                    code: ERROR_CODES.VALIDATION_ERROR,
                });
            });

            it('should throw error for empty string mnemonic', async () => {
                await expect(MnemonicToKeyPair('')).rejects.toThrow(WalletKitError);
            });

            it('should include expected and received word count in error message', async () => {
                const shortMnemonic = new Array(5).fill('abandon');

                await expect(MnemonicToKeyPair(shortMnemonic)).rejects.toThrow(/expected 12 or 24 words, got 5/);
            });

            it('should throw error for invalid mnemonic type', async () => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await expect(MnemonicToKeyPair(VALID_TON_MNEMONIC_24, 'invalid' as any)).rejects.toThrow(
                    WalletKitError,
                );
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await expect(MnemonicToKeyPair(VALID_TON_MNEMONIC_24, 'invalid' as any)).rejects.toMatchObject({
                    code: ERROR_CODES.VALIDATION_ERROR,
                });
            });

            it('should include received type in error message for invalid type', async () => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await expect(MnemonicToKeyPair(VALID_TON_MNEMONIC_24, 'invalid' as any)).rejects.toThrow(
                    /expected "ton" or "bip39", got "invalid"/,
                );
            });
        });
    });

    describe('CreateTonMnemonic', () => {
        it('should create a 24-word mnemonic', async () => {
            const mnemonic = await CreateTonMnemonic();

            expect(Array.isArray(mnemonic)).toBe(true);
            expect(mnemonic.length).toBe(24);
        });

        it('should return array of strings', async () => {
            const mnemonic = await CreateTonMnemonic();

            mnemonic.forEach((word) => {
                expect(typeof word).toBe('string');
                expect(word.length).toBeGreaterThan(0);
            });
        });

        it('should create different mnemonics on each call', async () => {
            const mnemonic1 = await CreateTonMnemonic();
            const mnemonic2 = await CreateTonMnemonic();

            expect(mnemonic1.join(' ')).not.toEqual(mnemonic2.join(' '));
        });

        it('should create valid mnemonic that can be converted to key pair', async () => {
            const mnemonic = await CreateTonMnemonic();
            const keyPair = await MnemonicToKeyPair(mnemonic, 'ton');

            expect(keyPair.publicKey).toBeInstanceOf(Uint8Array);
            expect(keyPair.secretKey).toBeInstanceOf(Uint8Array);
            expect(keyPair.publicKey.length).toBe(32);
            expect(keyPair.secretKey.length).toBe(64);
        });
    });
});
