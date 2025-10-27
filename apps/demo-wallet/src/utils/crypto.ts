/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Buffer } from 'buffer';

// Simple encryption using built-in crypto API
export class SimpleEncryption {
    private static encoder = new TextEncoder();
    private static decoder = new TextDecoder();

    static async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
        const baseKey = await crypto.subtle.importKey('raw', this.encoder.encode(password), 'PBKDF2', false, [
            'deriveKey',
        ]);

        return crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt,
                iterations: 100000,
                hash: 'SHA-256',
            },
            baseKey,
            {
                name: 'AES-GCM',
                length: 256,
            },
            false,
            ['encrypt', 'decrypt'],
        );
    }

    static async encrypt(data: string, password: string): Promise<string> {
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const key = await this.deriveKey(password, salt);

        const encrypted = await crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv,
            },
            key,
            this.encoder.encode(data),
        );

        // Combine salt, iv, and encrypted data
        const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
        combined.set(salt, 0);
        combined.set(iv, salt.length);
        combined.set(new Uint8Array(encrypted), salt.length + iv.length);

        return Buffer.from(combined).toString('base64');
    }

    static async decrypt(encryptedData: string, password: string): Promise<string> {
        const combined = new Uint8Array(Buffer.from(encryptedData, 'base64'));

        const salt = combined.slice(0, 16);
        const iv = combined.slice(16, 28);
        const data = combined.slice(28);

        const key = await this.deriveKey(password, salt);

        const decrypted = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv,
            },
            key,
            data,
        );

        return this.decoder.decode(decrypted);
    }
}

export const generateSalt = (): string => {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    return Buffer.from(salt).toString('base64');
};
