// Sign data request handler

import type { WalletInterface, EventSignDataRequest } from '../types';
import type { RawBridgeEvent, RequestContext, EventHandler, RawBridgeEventGeneric } from '../types/internal';
import { sanitizeString } from '../validation/sanitization';

export class SignDataHandler implements EventHandler<EventSignDataRequest> {
    canHandle(event: RawBridgeEvent): boolean {
        return (
            event.method === 'signData' || event.method === 'personal_sign' || event.method === 'tonconnect_signData'
        );
    }

    async handle(event: RawBridgeEvent, context: RequestContext): Promise<EventSignDataRequest> {
        const data = this.parseDataToSign(event);
        const preview = this.createDataPreview(data, event);

        const signEvent: EventSignDataRequest = {
            id: event.id,
            data,
            preview,
            wallet: context.wallet || this.createPlaceholderWallet(),
        };

        return signEvent;
    }

    /**
     * Parse data to sign from bridge event
     */
    private parseDataToSign(event: RawBridgeEventGeneric): Uint8Array {
        const params = event.params || {};

        // Data can come in various formats
        if (params.data) {
            return this.convertToUint8Array(params.data);
        }

        if (params.message) {
            return this.convertToUint8Array(params.message);
        }

        if (params.payload) {
            return this.convertToUint8Array(params.payload);
        }

        throw new Error('No data to sign found in request');
    }

    /**
     * Convert various data formats to Uint8Array
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private convertToUint8Array(data: any): Uint8Array {
        if (data instanceof Uint8Array) {
            return data;
        }

        if (typeof data === 'string') {
            // Try to detect format
            if (data.startsWith('0x')) {
                // Hex string
                return this.hexToUint8Array(data.slice(2));
            } else if (this.isBase64(data)) {
                // Base64 string
                return this.base64ToUint8Array(data);
            } else {
                // Plain text
                return new TextEncoder().encode(data);
            }
        }

        if (Array.isArray(data)) {
            // Array of numbers
            return new Uint8Array(data);
        }

        throw new Error('Unsupported data format for signing');
    }

    /**
     * Create human-readable preview of data to sign
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private createDataPreview(data: Uint8Array, event: RawBridgeEvent): any {
        const preview = this.analyzeDataContent(data);

        return {
            kind: preview.kind,
            content: sanitizeString(preview.content),
            metadata: {
                size: data.length,
                hash: this.calculateHash(data),
                encoding: this.detectEncoding(data),
            },
        };
    }

    /**
     * Analyze data content to determine preview type
     */
    private analyzeDataContent(data: Uint8Array): { kind: 'text' | 'json' | 'bytes'; content: string } {
        try {
            // Try to decode as UTF-8 text
            const text = new TextDecoder('utf-8', { fatal: true }).decode(data);

            // Check if it's valid JSON
            try {
                const parsed = JSON.parse(text);
                return {
                    kind: 'json',
                    content: JSON.stringify(parsed, null, 2),
                };
            } catch {
                // Not JSON, but valid text
                return {
                    kind: 'text',
                    content: text,
                };
            }
        } catch {
            // Not valid UTF-8, show as hex bytes
            return {
                kind: 'bytes',
                content: this.uint8ArrayToHex(data),
            };
        }
    }

    /**
     * Calculate simple hash of data for preview
     */
    private calculateHash(data: Uint8Array): string {
        // Simple hash for preview (not cryptographically secure)
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data[i];
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(16);
    }

    /**
     * Detect likely encoding of data
     */
    private detectEncoding(data: Uint8Array): string {
        // Simple heuristics to detect encoding
        if (data.length === 0) return 'empty';

        // Check for common patterns
        const hasNullBytes = data.some((byte) => byte === 0);
        const hasHighBytes = data.some((byte) => byte > 127);

        if (hasNullBytes) return 'binary';
        if (!hasHighBytes) return 'ascii';
        return 'utf8';
    }

    /**
     * Convert hex string to Uint8Array
     */
    private hexToUint8Array(hex: string): Uint8Array {
        const bytes = [];
        for (let i = 0; i < hex.length; i += 2) {
            bytes.push(parseInt(hex.substr(i, 2), 16));
        }
        return new Uint8Array(bytes);
    }

    /**
     * Convert base64 string to Uint8Array
     */
    private base64ToUint8Array(base64: string): Uint8Array {
        // Simple base64 decode (in real implementation, use proper library)
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }

    /**
     * Convert Uint8Array to hex string
     */
    private uint8ArrayToHex(data: Uint8Array): string {
        return Array.from(data)
            .map((byte) => byte.toString(16).padStart(2, '0'))
            .join('');
    }

    /**
     * Check if string is base64 format
     */
    private isBase64(str: string): boolean {
        try {
            return btoa(atob(str)) === str;
        } catch {
            return false;
        }
    }

    /**
     * Create placeholder wallet
     */
    private createPlaceholderWallet(): WalletInterface {
        return {
            publicKey: new Uint8Array(0),
            version: '',
            sign: async () => new Uint8Array(0),
            getAddress: () => '',
            getBalance: async () => BigInt(0),
            getStateInit: async () => '',
        };
    }
}
