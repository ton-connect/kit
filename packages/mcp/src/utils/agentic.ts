/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { randomBytes } from 'node:crypto';

import { Address, Cell } from '@ton/core';
import { Base64NormalizeUrl, CallForSuccess, getNftsFromClient, Signer, Uint8ArrayToBase64 } from '@ton/walletkit';
import type { ApiClient, FullAccountState } from '@ton/walletkit';

import { AgenticWalletCodeCell } from '../contracts/agentic_wallet/AgenticWallet.source.js';
import type { TonNetwork } from '../registry/config.js';
import { parsePrivateKeyInput } from './private-key.js';

const AGENTIC_DASHBOARD_BASE_URL = 'https://agents.ton.org/';

const AGENTIC_LOOKUP_RETRY_ATTEMPTS = 5;
const AGENTIC_LOOKUP_RETRY_DELAY_MS = 1500;
const AGENTIC_WALLET_CODE_HASH = AgenticWalletCodeCell.hash().toString('hex');

interface AgenticWalletState {
    nftItemIndex: bigint;
    collectionAddress: Address;
    isSignatureAllowed: boolean;
    seqno: number;
    ownerAddress: Address | null;
    nftItemContent: Cell | null;
    originOperatorPublicKey: bigint;
    operatorPublicKey: bigint;
    deployedByUser: boolean;
    isInitialized: boolean;
}

export interface AgenticImportCandidate {
    address: string;
    balanceNano: string;
    balanceTon: string;
    ownerAddress: string;
    operatorPublicKey?: string;
    originOperatorPublicKey?: string;
    collectionAddress: string;
    deployedByUser?: boolean;
    name?: string;
}

type AgenticWalletValidationErrorCode =
    | 'inactive_contract'
    | 'wrong_contract_type'
    | 'uninitialized_agentic_wallet'
    | 'unsupported_agentic_wallet_layout';

export class AgenticWalletValidationError extends Error {
    constructor(
        public readonly code: AgenticWalletValidationErrorCode,
        message: string,
    ) {
        super(message);
        this.name = 'AgenticWalletValidationError';
    }
}

interface AgenticWalletContractCheckResult {
    address: string;
    network: TonNetwork;
    accountStatus: FullAccountState['status'];
    hasCode: boolean;
    codeHash?: string;
    expectedCodeHash: string;
    contractType: 'agentic_wallet';
}

function isRetriableAgenticLookupError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return (
        /\b429\b/i.test(message) ||
        /Too Many Requests/i.test(message) ||
        /timeout/i.test(message) ||
        /fetch failed/i.test(message) ||
        /ECONNRESET|ECONNREFUSED|ETIMEDOUT|EAI_AGAIN/i.test(message) ||
        /HTTP 5\d\d/i.test(message)
    );
}

async function withAgenticLookupRetry<T>(fn: () => Promise<T>): Promise<T> {
    return CallForSuccess(fn, AGENTIC_LOOKUP_RETRY_ATTEMPTS, AGENTIC_LOOKUP_RETRY_DELAY_MS, (error) =>
        isRetriableAgenticLookupError(error),
    );
}

function getAccountCodeHash(accountState: FullAccountState): string | undefined {
    if (!accountState.code) {
        return undefined;
    }
    return Cell.fromBase64(accountState.code).hash().toString('hex');
}

function assertAgenticWalletContract(input: {
    accountState: FullAccountState;
    address: string;
    network: TonNetwork;
}): AgenticWalletContractCheckResult {
    const codeHash = getAccountCodeHash(input.accountState);

    if (input.accountState.status !== 'active' || !input.accountState.code) {
        throw new AgenticWalletValidationError(
            'inactive_contract',
            `Address ${input.address} is not an active agentic wallet contract on ${input.network}.`,
        );
    }

    if (codeHash !== AGENTIC_WALLET_CODE_HASH) {
        throw new AgenticWalletValidationError(
            'wrong_contract_type',
            `Address ${input.address} is not an agentic wallet contract.`,
        );
    }

    return {
        address: input.address,
        network: input.network,
        accountStatus: input.accountState.status,
        hasCode: Boolean(input.accountState.code),
        codeHash,
        expectedCodeHash: AGENTIC_WALLET_CODE_HASH,
        contractType: 'agentic_wallet',
    };
}

function normalizeAgenticWalletStateError(error: unknown, input: { address: string; network: TonNetwork }): never {
    if (error instanceof AgenticWalletValidationError) {
        throw error;
    }

    throw new AgenticWalletValidationError(
        'unsupported_agentic_wallet_layout',
        `Agentic wallet ${input.address} on ${input.network} has an unsupported wallet version/layout.`,
    );
}

function formatPublicKeyHex(value: bigint): string {
    return `0x${value.toString(16)}`;
}

function normalizePublicKeyHex(value: string): string {
    const stripped = value.trim().replace(/^0x/i, '');
    if (!stripped) {
        throw new Error('Public key is empty');
    }
    return formatPublicKeyHex(BigInt(`0x${stripped}`));
}

function normalizeTonAddress(value: string | Address): string {
    return (typeof value === 'string' ? Address.parse(value) : value).toRawString();
}

export async function generateOperatorKeyPair(): Promise<{ privateKey: string; publicKey: string }> {
    const seed = randomBytes(32);
    const signer = await Signer.fromPrivateKey(seed);
    return {
        privateKey: `0x${Buffer.from(seed).toString('hex')}`,
        publicKey: normalizePublicKeyHex(signer.publicKey),
    };
}

export async function resolveOperatorCredentials(
    privateKey: string,
    expectedPublicKey?: string,
    deps?: {
        createSigner?: (seed: Uint8Array) => Promise<{ publicKey: string }>;
    },
): Promise<{ privateKey: string; publicKey: string }> {
    const parsed = parsePrivateKeyInput(privateKey);
    const createSigner = deps?.createSigner ?? ((seed: Uint8Array) => Signer.fromPrivateKey(seed));
    const signer = await createSigner(parsed.seed);
    const publicKey = normalizePublicKeyHex(signer.publicKey);

    if (expectedPublicKey && publicKey.toLowerCase() !== normalizePublicKeyHex(expectedPublicKey).toLowerCase()) {
        throw new Error('Private key does not match the current agent operator public key.');
    }

    return {
        privateKey: `0x${parsed.normalizedHex}`,
        publicKey,
    };
}

export function buildAgenticCreateDeepLink(input: {
    operatorPublicKey: string;
    callbackUrl: string;
    agentName?: string;
    source?: string;
    tonDeposit?: string;
}): string {
    const url = new URL('/create', AGENTIC_DASHBOARD_BASE_URL);
    const payload: Record<string, string> = {
        originOperatorPublicKey: input.operatorPublicKey,
        callbackUrl: input.callbackUrl,
    };
    if (input.agentName?.trim()) {
        payload.agentName = input.agentName.trim();
    }
    if (input.source?.trim()) {
        payload.source = input.source.trim();
    }
    if (input.tonDeposit?.trim()) {
        payload.tonDeposit = input.tonDeposit.trim();
    }
    const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
    url.searchParams.set('data', Base64NormalizeUrl(Uint8ArrayToBase64(payloadBytes)));
    return url.toString();
}

export function buildAgenticDashboardLink(address: string): string {
    return new URL(`/agent/${address}`, AGENTIC_DASHBOARD_BASE_URL).toString();
}

export function buildAgenticChangeKeyDeepLink(address: string, nextOperatorPublicKey: string): string {
    const url = new URL(`/agent/${address}`, AGENTIC_DASHBOARD_BASE_URL);
    url.searchParams.set('action', 'change-public-key');
    url.searchParams.set('nextOperatorPublicKey', nextOperatorPublicKey);
    return url.toString();
}

function parseAgenticWalletState(accountState: FullAccountState, address: string): AgenticWalletState {
    if (!accountState.data) {
        throw new Error(`Account state data is empty for ${address}`);
    }

    const stateCell = Cell.fromBase64(accountState.data);
    const slice = stateCell.beginParse();

    const nftItemIndex = slice.loadUintBig(256);
    const collectionAddress = slice.loadAddress();
    const isSignatureAllowed = slice.loadBit();
    const seqno = slice.loadUint(32);

    const hasExtensionsDict = slice.loadBit();
    if (hasExtensionsDict) {
        slice.loadRef();
    }

    const walletData = slice.loadMaybeRef();
    if (!walletData) {
        return {
            nftItemIndex,
            collectionAddress,
            isSignatureAllowed,
            seqno,
            ownerAddress: null,
            nftItemContent: null,
            originOperatorPublicKey: 0n,
            operatorPublicKey: 0n,
            deployedByUser: true,
            isInitialized: false,
        };
    }

    const wallet = walletData.beginParse();
    const ownerAddress = wallet.loadAddress();
    const nftItemContent = wallet.loadMaybeRef();
    const originOperatorPublicKey = wallet.loadUintBig(256);
    const operatorPublicKey = wallet.loadUintBig(256);
    const deployedByUser = wallet.loadBit();

    return {
        nftItemIndex,
        collectionAddress,
        isSignatureAllowed,
        seqno,
        ownerAddress,
        nftItemContent,
        originOperatorPublicKey,
        operatorPublicKey,
        deployedByUser,
        isInitialized: true,
    };
}

async function getAgenticWalletSnapshot(input: {
    client: ApiClient;
    address: string;
    network: TonNetwork;
}): Promise<{ state: AgenticWalletState; balanceNano: string; balanceTon: string }> {
    const accountState = await withAgenticLookupRetry(() => input.client.getAccountState(input.address));
    assertAgenticWalletContract({
        accountState,
        address: input.address,
        network: input.network,
    });
    const balanceNano = BigInt(accountState.balance ?? '0').toString();
    let state: AgenticWalletState;
    try {
        state = parseAgenticWalletState(accountState, input.address);
    } catch (error) {
        return normalizeAgenticWalletStateError(error, {
            address: input.address,
            network: input.network,
        });
    }
    return {
        state,
        balanceNano,
        balanceTon: (Number(balanceNano) / 1e9).toFixed(4),
    };
}

function extractMetadataText(cell: Cell | null): string | undefined {
    if (!cell) {
        return undefined;
    }

    try {
        const slice = cell.beginParse();
        const prefix = slice.loadUint(8);
        if (prefix !== 0x00) {
            return undefined;
        }
        const content = slice.loadRef();
        const contentSlice = content.beginParse();
        if (contentSlice.remainingBits >= 8) {
            contentSlice.loadUint(8);
        }
        const bytes: number[] = [];
        while (contentSlice.remainingBits >= 8) {
            bytes.push(contentSlice.loadUint(8));
        }
        const text = Buffer.from(bytes).toString('utf-8').trim();
        return text || undefined;
    } catch {
        return undefined;
    }
}

export async function listAgenticWalletsByOwner(input: {
    client: ApiClient;
    ownerAddress: string;
    collectionAddress: string;
    network: TonNetwork;
}): Promise<AgenticImportCandidate[]> {
    const items: AgenticImportCandidate[] = [];
    const normalizedCollectionAddress = normalizeTonAddress(input.collectionAddress);

    for (let page = 0; page < 10; page += 1) {
        const response = await withAgenticLookupRetry(() =>
            getNftsFromClient(input.client, input.ownerAddress, {
                pagination: {
                    limit: 100,
                    offset: page * 100,
                },
            }),
        );
        const nfts = response.nfts ?? [];

        for (const nft of nfts) {
            if (
                !nft.collection?.address ||
                normalizeTonAddress(nft.collection.address) !== normalizedCollectionAddress
            ) {
                continue;
            }

            try {
                const snapshot = await getAgenticWalletSnapshot({
                    client: input.client,
                    address: nft.address,
                    network: input.network,
                });
                const { state, balanceNano, balanceTon } = snapshot;

                items.push({
                    address: nft.address,
                    balanceNano,
                    balanceTon,
                    ownerAddress: state.ownerAddress?.toString() ?? input.ownerAddress,
                    operatorPublicKey: formatPublicKeyHex(state.operatorPublicKey),
                    originOperatorPublicKey: formatPublicKeyHex(state.originOperatorPublicKey),
                    collectionAddress: state.collectionAddress.toString(),
                    deployedByUser: state.deployedByUser,
                    name: nft.info?.name ?? extractMetadataText(state.nftItemContent),
                });
            } catch {
                // Skip malformed or uninitialized records.
            }
        }

        if (nfts.length < 100) {
            break;
        }
    }

    return items;
}

export async function validateAgenticWalletAddress(input: {
    client: ApiClient;
    address: string;
    collectionAddress?: string;
    ownerAddress?: string;
    network: TonNetwork;
}): Promise<AgenticImportCandidate> {
    const snapshot = await getAgenticWalletSnapshot({
        client: input.client,
        address: input.address,
        network: input.network,
    });
    const { state, balanceNano, balanceTon } = snapshot;
    if (!state.isInitialized) {
        throw new AgenticWalletValidationError(
            'uninitialized_agentic_wallet',
            `Agentic wallet ${input.address} is not initialized on ${input.network}.`,
        );
    }

    if (
        input.collectionAddress &&
        normalizeTonAddress(state.collectionAddress) !== normalizeTonAddress(input.collectionAddress)
    ) {
        throw new Error(`Wallet ${input.address} does not belong to collection ${input.collectionAddress}`);
    }

    if (
        input.ownerAddress &&
        state.ownerAddress &&
        normalizeTonAddress(state.ownerAddress) !== normalizeTonAddress(input.ownerAddress)
    ) {
        throw new Error(`Wallet ${input.address} is owned by ${state.ownerAddress?.toString() ?? 'unknown owner'}`);
    }

    return {
        address: input.address,
        balanceNano,
        balanceTon,
        ownerAddress: state.ownerAddress?.toString() ?? '',
        operatorPublicKey: formatPublicKeyHex(state.operatorPublicKey),
        originOperatorPublicKey: formatPublicKeyHex(state.originOperatorPublicKey),
        collectionAddress: state.collectionAddress.toString(),
        deployedByUser: state.deployedByUser,
        name: extractMetadataText(state.nftItemContent),
    };
}
