/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Buffer } from 'buffer';

type PolyfillTarget = typeof globalThis & {
    TextEncoder?: typeof TextEncoder;
    TextDecoder?: typeof TextDecoder;
};

type PolyfillBufferSource = ArrayBuffer | ArrayBufferView;

type EncodeIntoResult = {
    read: number;
    written: number;
};

interface DecoderOptions {
    fatal?: boolean;
    ignoreBOM?: boolean;
}

interface DecodeOptions {
    stream?: boolean;
}

function toUint8Array(input: PolyfillBufferSource): Uint8Array {
    if (input instanceof Uint8Array) {
        return input;
    }
    if (input instanceof ArrayBuffer) {
        return new Uint8Array(input);
    }
    return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
}

class BufferTextEncoder implements TextEncoder {
    readonly encoding = 'utf-8';

    encode(input: string = ''): Uint8Array {
        return Uint8Array.from(Buffer.from(input, 'utf-8'));
    }

    encodeInto(source: string, destination: Uint8Array): EncodeIntoResult {
        const encoded = this.encode(source);
        const writable = Math.min(encoded.length, destination.length);
        destination.set(encoded.subarray(0, writable));
        return { read: source.length, written: writable };
    }
}

class BufferTextDecoder implements TextDecoder {
    readonly encoding: string;
    readonly fatal: boolean;
    readonly ignoreBOM: boolean;

    constructor(label = 'utf-8', options?: DecoderOptions) {
        this.encoding = label.toLowerCase();
        this.fatal = Boolean(options?.fatal);
        this.ignoreBOM = Boolean(options?.ignoreBOM);
    }

    decode(input?: PolyfillBufferSource, options?: DecodeOptions): string {
        if (!input) {
            return '';
        }
        const view = toUint8Array(input);
        if (options?.stream) {
            // Streaming decode is not supported in this lightweight polyfill.
            // The input is decoded eagerly which is acceptable for WalletKit use cases.
        }
        return Buffer.from(view).toString('utf-8');
    }
}

export default function applyTextEncoderPolyfill(target: PolyfillTarget): void {
    if (typeof target.TextEncoder === 'undefined') {
        target.TextEncoder = BufferTextEncoder as typeof TextEncoder;
    }

    if (typeof target.TextDecoder === 'undefined') {
        target.TextDecoder = BufferTextDecoder as typeof TextDecoder;
    }
}
