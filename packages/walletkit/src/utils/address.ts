import { Address } from '@ton/core';

export function formatWalletAddress(address: string | Address, isTestnet: boolean = false) {
    if (typeof address === 'string') {
        return Address.parse(address).toString({ bounceable: false, testOnly: isTestnet });
    }
    return address.toString({ bounceable: false, testOnly: isTestnet });
}

export function isValidAddress(address: unknown): boolean {
    if (typeof address !== 'string') {
        return false;
    }

    try {
        Address.parse(address);
    } catch (_) {
        return false;
    }

    return true;
}

export function isFriendlyTonAddress(address: string): boolean {
    try {
        Address.parseFriendly(address);
    } catch (_) {
        return false;
    }

    return true;
}
