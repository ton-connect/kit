// Validation utilities

export const validateChainId = (chainId: number): boolean => {
    return chainId === 1 || chainId === 2; // mainnet or testnet
};

export const validateAddress = (address: string): boolean => {
    // Basic TON address validation
    return address.length > 0 && (address.startsWith('EQ') || address.startsWith('UQ') || address.startsWith('0:'));
};

export const validateAmount = (amount: string): boolean => {
    return /^[0-9]+$/.test(amount) && BigInt(amount) > 0n;
};

export const normalizeAddress = (address: string): string => {
    // Convert address to standard format if needed
    return address;
};
