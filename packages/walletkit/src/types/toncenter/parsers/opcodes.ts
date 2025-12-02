/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Registry of known operation codes for TON blockchain messages
 * Provides type-safe opcode definitions and utilities for matching messages
 */

export enum OpCode {
    // Jetton operations
    JettonTransfer = '0x0f8a7ea5',
    JettonInternalTransfer = '0x178d4519',
    JettonNotify = '0x7362d09c',
    JettonBurn = '0x595f07bc',
    JettonMint = '0x15',

    // NFT operations
    NftTransfer = '0x5fcc3d14',
    NftOwnershipAssigned = '0x05138d91',
    NftOwnerChanged = '0x7bdd97de',
    NftGetStaticData = '0x2fcb26a2',
    NftReportStaticData = '0x8b771735',

    // Excess (common)
    Excess = '0xd53276db',

    // Wallet operations
    WalletV4Transfer = '0x0',

    // DNS operations
    DnsResolve = '0x19f02441',
    DnsChangeRecord = '0x4eb1f0f9',

    // DEX operations (common patterns)
    DexSwap = '0x25938561',
    DexProvideLiquidity = '0xfcf9e58f',
}

/**
 * Message type names corresponding to opcodes
 */
export enum MessageType {
    JettonTransfer = 'jetton_transfer',
    JettonInternalTransfer = 'jetton_internal_transfer',
    JettonNotify = 'jetton_notify',
    JettonBurn = 'jetton_burn',
    JettonMint = 'jetton_mint',

    NftTransfer = 'nft_transfer',
    NftOwnershipAssigned = 'nft_ownership_assigned',
    NftOwnerChanged = 'nft_owner_changed',

    Excess = 'excess',

    TonTransfer = 'ton_transfer',
    ContractExec = 'contract_exec',
    ContractDeploy = 'contract_deploy',

    Unknown = 'unknown',
}

/**
 * Bidirectional mapping between opcodes and message types
 */
export const OpCodeMapping: Record<OpCode, MessageType> = {
    [OpCode.JettonTransfer]: MessageType.JettonTransfer,
    [OpCode.JettonInternalTransfer]: MessageType.JettonInternalTransfer,
    [OpCode.JettonNotify]: MessageType.JettonNotify,
    [OpCode.JettonBurn]: MessageType.JettonBurn,
    [OpCode.JettonMint]: MessageType.JettonMint,

    [OpCode.NftTransfer]: MessageType.NftTransfer,
    [OpCode.NftOwnershipAssigned]: MessageType.NftOwnershipAssigned,
    [OpCode.NftOwnerChanged]: MessageType.NftOwnerChanged,
    [OpCode.NftGetStaticData]: MessageType.Unknown,
    [OpCode.NftReportStaticData]: MessageType.Unknown,

    [OpCode.Excess]: MessageType.Excess,

    [OpCode.WalletV4Transfer]: MessageType.TonTransfer,
    [OpCode.DnsResolve]: MessageType.Unknown,
    [OpCode.DnsChangeRecord]: MessageType.Unknown,
    [OpCode.DexSwap]: MessageType.Unknown,
    [OpCode.DexProvideLiquidity]: MessageType.Unknown,
};

/**
 * Reverse mapping for quick lookup
 */
export const MessageTypeToOpCode: Record<MessageType, OpCode | undefined> = {
    [MessageType.JettonTransfer]: OpCode.JettonTransfer,
    [MessageType.JettonInternalTransfer]: OpCode.JettonInternalTransfer,
    [MessageType.JettonNotify]: OpCode.JettonNotify,
    [MessageType.JettonBurn]: OpCode.JettonBurn,
    [MessageType.JettonMint]: OpCode.JettonMint,

    [MessageType.NftTransfer]: OpCode.NftTransfer,
    [MessageType.NftOwnershipAssigned]: OpCode.NftOwnershipAssigned,
    [MessageType.NftOwnerChanged]: OpCode.NftOwnerChanged,

    [MessageType.Excess]: OpCode.Excess,

    [MessageType.TonTransfer]: OpCode.WalletV4Transfer,
    [MessageType.ContractExec]: undefined,
    [MessageType.ContractDeploy]: undefined,
    [MessageType.Unknown]: undefined,
};

/**
 * Legacy mapping for backwards compatibility
 */
export const LegacyOpCodeMap: Record<string, string> = {
    '0x0f8a7ea5': 'jetton_transfer',
    '0x178d4519': 'jetton_internal_transfer',
    '0x7362d09c': 'jetton_notify',
    '0x595f07bc': 'jetton_burn',
    '0xd53276db': 'excess',
    '0x5fcc3d14': 'nft_transfer',
    '0x05138d91': 'nft_ownership_assigned',
    '0x7bdd97de': 'nft_owner_changed',
};

/**
 * Resolves an opcode string to a MessageType
 */
export function resolveOpCode(opcode: string): MessageType {
    const normalized = opcode.toLowerCase();

    // Try direct OpCode enum match
    for (const [_key, value] of Object.entries(OpCode)) {
        if (value.toLowerCase() === normalized) {
            return OpCodeMapping[value as OpCode];
        }
    }

    // Try legacy mapping
    const legacy = LegacyOpCodeMap[normalized];
    if (legacy) {
        return legacy as MessageType;
    }

    return MessageType.Unknown;
}

/**
 * Checks if an opcode matches any of the given message types
 */
export function matchesMessageType(opcode: string, types: MessageType[]): MessageType | null {
    const resolved = resolveOpCode(opcode);
    return types.includes(resolved) ? resolved : null;
}

/**
 * Checks if decoded message matches a message type
 */
export function matchesDecodedType(decodedType: string, types: MessageType[]): MessageType | null {
    // Try direct match with decoded @type
    for (const type of types) {
        if (decodedType === type || decodedType === type.replace('_', '')) {
            return type;
        }
    }
    return null;
}
