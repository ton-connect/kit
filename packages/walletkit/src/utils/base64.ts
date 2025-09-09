export function base64Normalize(data: string): string {
    return data.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
}

export function parseBase64(data: string): string {
    if (typeof atob === 'undefined') {
        throw new Error('atob is not available in this environment');
    }
    data = base64Normalize(data);
    return atob(data);
}

export function base64ToUint8Array(data?: string | null): Uint8Array | null {
    if (!data) return null;
    const binary = parseBase64(data);
    const len = binary.length;
    const bytes = new Uint8Array(len);

    for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return bytes;
}

export function uint8ArrayToBase64(data: Uint8Array): string {
    if (typeof btoa === 'undefined') {
        throw new Error('btoa is not available in this environment');
    }
    let binary = '';
    for (let i = 0; i < data.length; i++) {
        binary += String.fromCharCode(data[i]);
    }
    return btoa(binary);
}

export function base64ToBigInt(data?: string | null): bigint {
    if (!data || data === '') return 0n;
    const binary = parseBase64(data);

    const len = binary.length;
    let result = 0n;

    for (let i = 0; i < len; i++) {
        result = (result << 8n) + BigInt(binary.charCodeAt(i));
    }

    return result;
}

export function bigIntToBase64(data: bigint): string {
    if (data === 0n) return '';
    const bytes: number[] = [];
    let temp = data;
    while (temp > 0n) {
        bytes.push(Number(temp & 0xffn));
        temp >>= 8n;
    }
    const arr = new Uint8Array(bytes.reverse());
    return uint8ArrayToBase64(arr);
}

export function uint8ArrayToBigInt(data: Uint8Array): bigint {
    let result = 0n;
    for (let i = 0; i < data.length; i++) {
        result = (result << 8n) + BigInt(data[i]);
    }
    return result;
}
