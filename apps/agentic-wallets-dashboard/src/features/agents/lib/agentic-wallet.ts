/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Address } from '@ton/core';
import { beginCell, Cell, contractAddress, internal, SendMode, storeOutList, storeStateInit } from '@ton/core';
import {
    createJettonTransferPayload,
    createNftTransferPayload,
    DEFAULT_JETTON_GAS_FEE,
    DEFAULT_NFT_GAS_FEE,
} from '@ton/walletkit';
import type { TransactionRequest } from '@ton/appkit';

const OP_EXTENSION_ACTION_REQUEST = 0x6578746e;
const OP_DEPLOY_WALLET = 0x0609e47b;
const OP_CHANGE_OPERATOR = 0xea4e36cf;
const OP_CHANGE_NFT_CONTENT = 0x1a0b9d51;

type RawStackItem =
    | { type: 'null' }
    | { type: 'num'; value: string }
    | { type: 'cell'; value: string }
    | { type: 'slice'; value: string }
    | { type: 'builder'; value: string }
    | { type: 'tuple'; value: RawStackItem[] }
    | { type: 'list'; value: RawStackItem[] };

type RunGetMethodResult = {
    gasUsed?: number;
    exitCode?: number;
    stack: RawStackItem[];
};

export interface ToncenterLikeClient {
    runGetMethod(address: string, method: string, stack?: RawStackItem[]): Promise<RunGetMethodResult>;
    getAccountState?(address: string): Promise<{ data?: string | null; status?: string | null }>;
    getEvents?(request: { account: string; limit?: number; offset?: number }): Promise<{ events: unknown[] }>;
}

export type AgentNftData = {
    nftItemIndex: bigint;
    collectionAddress: Address;
    ownerAddress: Address | null;
    nftItemContent: Cell | null;
};

export type AgentWalletState = {
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
};

export type DeployWalletRuntimeData = {
    ownerAddress: Address;
    nftItemContent: Cell | null;
    originOperatorPublicKey: bigint;
    operatorPublicKey: bigint;
    deployedByUser: boolean;
};

export type WithdrawJettonAction = {
    jettonWalletAddress: Address;
    amount: bigint;
};

export type WithdrawNftAction = {
    nftAddress: Address;
};

function parseNum(value: string): bigint {
    if (value.startsWith('-')) {
        return -BigInt(value.slice(1));
    }
    return BigInt(value);
}

function parseCellLike(item: RawStackItem): Cell {
    if (item.type !== 'cell' && item.type !== 'slice' && item.type !== 'builder') {
        throw new Error(`Unexpected stack item type: ${item.type} (expected cell/slice/builder)`);
    }
    return Cell.fromBoc(Buffer.from(item.value, 'base64'))[0];
}

function assertGetMethodSuccess(result: RunGetMethodResult, method: string, address: string): void {
    if (typeof result.exitCode === 'number' && result.exitCode !== 0) {
        throw new Error(
            `Get-method ${method} failed for ${address} (exitCode=${result.exitCode}). Check collection address/network.`,
        );
    }
}

function parseAddress(item: RawStackItem): Address {
    const cell = parseCellLike(item);
    const slice = cell.beginParse();
    return slice.loadAddress();
}

function parseAddressOpt(item: RawStackItem): Address | null {
    if (item.type === 'null') {
        return null;
    }
    return parseAddress(item);
}

function parseCellOpt(item: RawStackItem): Cell | null {
    if (item.type === 'null') {
        return null;
    }
    return parseCellLike(item);
}

function walletRuntimeDataToCell(data: DeployWalletRuntimeData): Cell {
    return beginCell()
        .storeAddress(data.ownerAddress)
        .storeMaybeRef(data.nftItemContent)
        .storeUint(data.originOperatorPublicKey, 256)
        .storeUint(data.operatorPublicKey, 256)
        .storeBit(data.deployedByUser)
        .endCell();
}

function agenticWalletConfigToCell(nftItemIndex: bigint, collectionAddress: Address): Cell {
    return beginCell()
        .storeUint(nftItemIndex, 256)
        .storeAddress(collectionAddress)
        .storeBit(true)
        .storeUint(0, 32)
        .storeDict(null)
        .storeMaybeRef(null)
        .endCell();
}

function walletIndexSeedToCell(ownerAddress: Address, originOperatorPublicKey: bigint, deployedByUser = true): Cell {
    return beginCell()
        .storeAddress(ownerAddress)
        .storeUint(originOperatorPublicKey, 256)
        .storeBit(deployedByUser)
        .endCell();
}

function numStackItem(value: bigint): RawStackItem {
    return {
        type: 'num',
        value: value < 0n ? `-${(-value).toString()}` : value.toString(),
    };
}

export function createQueryId(): bigint {
    const now = BigInt(Date.now());
    const rand = BigInt(Math.floor(Math.random() * 0xffff));
    return (now << 16n) | rand;
}

export function calculateWalletIndex(
    ownerAddress: Address,
    originOperatorPublicKey: bigint,
    deployedByUser = true,
): bigint {
    return BigInt(
        `0x${walletIndexSeedToCell(ownerAddress, originOperatorPublicKey, deployedByUser).hash().toString('hex')}`,
    );
}

export function buildWalletStateInit(walletCodeBoc: string, nftItemIndex: bigint, collectionAddress: Address) {
    if (!walletCodeBoc) {
        throw new Error('VITE_AGENTIC_WALLET_CODE_BOC is not configured');
    }

    const code = Cell.fromBase64(walletCodeBoc);
    const data = agenticWalletConfigToCell(nftItemIndex, collectionAddress);
    const init = { code, data };

    return {
        init,
        stateInit: beginCell().store(storeStateInit(init)).endCell(),
        address: contractAddress(0, init),
    };
}

export function createDeployWalletBody(message: {
    queryId: bigint;
    walletData: DeployWalletRuntimeData | Cell;
    senderOriginOperatorPublicKey?: bigint;
}): Cell {
    const runtimeCell =
        message.walletData instanceof Cell ? message.walletData : walletRuntimeDataToCell(message.walletData);
    return beginCell()
        .storeUint(OP_DEPLOY_WALLET, 32)
        .storeUint(message.queryId, 64)
        .storeRef(runtimeCell)
        .storeUint(message.senderOriginOperatorPublicKey ?? 0n, 256)
        .endCell();
}

export function createChangeOperatorBody(queryId: bigint, newOperatorPublicKey: bigint): Cell {
    return beginCell()
        .storeUint(OP_CHANGE_OPERATOR, 32)
        .storeUint(queryId, 64)
        .storeUint(newOperatorPublicKey, 256)
        .endCell();
}

export function createChangeNftContentBody(queryId: bigint, newNftItemContent: Cell | null): Cell {
    return beginCell()
        .storeUint(OP_CHANGE_NFT_CONTENT, 32)
        .storeUint(queryId, 64)
        .storeMaybeRef(newNftItemContent)
        .endCell();
}

export function createWithdrawAllOutActions(
    ownerAddress: Address,
    assets?: {
        includeTon?: boolean;
        jettons?: WithdrawJettonAction[];
        nfts?: WithdrawNftAction[];
    },
): Cell {
    const outActions: Array<{ type: 'sendMsg'; mode: number; outMsg: ReturnType<typeof internal> }> = [];

    for (const jetton of assets?.jettons ?? []) {
        if (jetton.amount <= 0n) {
            continue;
        }

        outActions.push({
            type: 'sendMsg',
            mode: SendMode.PAY_GAS_SEPARATELY | SendMode.IGNORE_ERRORS,
            outMsg: internal({
                to: jetton.jettonWalletAddress,
                value: BigInt(DEFAULT_JETTON_GAS_FEE),
                bounce: true,
                body: createJettonTransferPayload({
                    amount: jetton.amount,
                    destination: ownerAddress.toString(),
                    responseDestination: ownerAddress.toString(),
                    comment: 'Withdraw jetton from agent wallet',
                }),
            }),
        });
    }

    for (const nft of assets?.nfts ?? []) {
        outActions.push({
            type: 'sendMsg',
            mode: SendMode.PAY_GAS_SEPARATELY | SendMode.IGNORE_ERRORS,
            outMsg: internal({
                to: nft.nftAddress,
                value: BigInt(DEFAULT_NFT_GAS_FEE),
                bounce: true,
                body: createNftTransferPayload({
                    newOwner: ownerAddress.toString(),
                    responseDestination: ownerAddress.toString(),
                    comment: 'Withdraw NFT from agent wallet',
                }),
            }),
        });
    }

    if (assets?.includeTon ?? true) {
        outActions.push({
            type: 'sendMsg',
            mode: SendMode.CARRY_ALL_REMAINING_BALANCE | SendMode.IGNORE_ERRORS,
            outMsg: internal({
                to: ownerAddress,
                value: 0n,
                bounce: false,
            }),
        });
    }

    return beginCell().store(storeOutList(outActions)).endCell();
}

export function createExtensionActionRequestBody(queryId: bigint, outActions: Cell | null): Cell {
    return beginCell()
        .storeUint(OP_EXTENSION_ACTION_REQUEST, 32)
        .storeUint(queryId, 64)
        .storeMaybeRef(outActions)
        .storeBit(false)
        .endCell();
}

export function cellToBase64(cell: Cell): string {
    return cell.toBoc().toString('base64');
}

function parseCellFromBase64Boc(value: string): Cell {
    const cells = Cell.fromBoc(Buffer.from(value, 'base64'));
    if (!cells.length) {
        throw new Error('Invalid account state data cell');
    }
    return cells[0];
}

export function parseAgentWalletStateData(dataCell: Cell): AgentWalletState {
    const slice = dataCell.beginParse();

    const nftItemIndex = slice.loadUintBig(256);
    const collectionAddress = slice.loadAddress();
    const isSignatureAllowed = slice.loadBit();
    const seqno = Number(slice.loadUint(32));

    // extensions dict (HashmapE) is stored inline in storage and encoded as maybe-ref
    const hasExtensionsDict = slice.loadBit();
    if (hasExtensionsDict) {
        slice.loadRef();
    }

    const walletDataRef = slice.loadMaybeRef();
    if (!walletDataRef) {
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

    const wallet = walletDataRef.beginParse();
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

export async function getAgentWalletState(
    client: ToncenterLikeClient,
    walletAddress: string,
): Promise<AgentWalletState> {
    if (!client.getAccountState) {
        throw new Error('Client does not support getAccountState');
    }

    const state = await client.getAccountState(walletAddress);
    if (!state?.data) {
        throw new Error(`Account state data is empty for ${walletAddress}`);
    }

    return parseAgentWalletStateData(parseCellFromBase64Boc(state.data));
}

export function buildRenameAgentTransaction(params: {
    agentAddress: string;
    queryId: bigint;
    gasAmountNano: bigint;
    updatedNftItemContent: Cell;
    networkChainId: string;
}): TransactionRequest {
    const payload = createChangeNftContentBody(params.queryId, params.updatedNftItemContent);
    return {
        network: { chainId: params.networkChainId },
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [
            {
                address: params.agentAddress,
                amount: params.gasAmountNano.toString(),
                payload: cellToBase64(payload),
            },
        ],
    };
}

export async function getPublicKey(client: ToncenterLikeClient, walletAddress: string): Promise<bigint> {
    try {
        const state = await getAgentWalletState(client, walletAddress);
        return state.isInitialized ? state.operatorPublicKey : -1n;
    } catch {
        // fallback to getter for compatibility with older/unknown layouts
    }

    const result = await client.runGetMethod(walletAddress, 'get_public_key');
    assertGetMethodSuccess(result, 'get_public_key', walletAddress);
    const item = result.stack[0];
    if (!item || item.type !== 'num') {
        throw new Error('Invalid get_public_key response');
    }
    return parseNum(item.value);
}

export async function getOriginPublicKey(client: ToncenterLikeClient, walletAddress: string): Promise<bigint> {
    try {
        const state = await getAgentWalletState(client, walletAddress);
        return state.isInitialized ? state.originOperatorPublicKey : -1n;
    } catch {
        // fallback to getter for compatibility with older/unknown layouts
    }

    const result = await client.runGetMethod(walletAddress, 'get_origin_public_key');
    assertGetMethodSuccess(result, 'get_origin_public_key', walletAddress);
    const item = result.stack[0];
    if (!item || item.type !== 'num') {
        throw new Error('Invalid get_origin_public_key response');
    }
    return parseNum(item.value);
}

export async function getNftData(client: ToncenterLikeClient, walletAddress: string): Promise<AgentNftData> {
    try {
        const state = await getAgentWalletState(client, walletAddress);
        if (!state.isInitialized) {
            throw new Error('Agent wallet is not initialized');
        }

        return {
            nftItemIndex: state.nftItemIndex,
            collectionAddress: state.collectionAddress,
            ownerAddress: state.ownerAddress,
            nftItemContent: state.nftItemContent,
        };
    } catch {
        // fallback to getter for compatibility with older/unknown layouts
    }

    const result = await client.runGetMethod(walletAddress, 'get_nft_data');
    assertGetMethodSuccess(result, 'get_nft_data', walletAddress);
    const [isInitialized, nftItemIndex, collectionAddress, ownerAddress, nftItemContent] = result.stack;

    if (!isInitialized || isInitialized.type !== 'num' || parseNum(isInitialized.value) === 0n) {
        throw new Error('Agent wallet is not initialized');
    }

    if (!nftItemIndex || nftItemIndex.type !== 'num') {
        throw new Error('Invalid get_nft_data response (nftItemIndex)');
    }

    if (!collectionAddress) {
        throw new Error('Invalid get_nft_data response (collectionAddress)');
    }

    return {
        nftItemIndex: parseNum(nftItemIndex.value),
        collectionAddress: parseAddress(collectionAddress),
        ownerAddress: ownerAddress ? parseAddressOpt(ownerAddress) : null,
        nftItemContent: nftItemContent ? parseCellOpt(nftItemContent) : null,
    };
}

export async function getCollectionAddressByIndex(
    client: ToncenterLikeClient,
    collectionAddress: string,
    itemIndex: bigint,
): Promise<Address> {
    const result = await client.runGetMethod(collectionAddress, 'get_nft_address_by_index', [numStackItem(itemIndex)]);
    assertGetMethodSuccess(result, 'get_nft_address_by_index', collectionAddress);
    const item = result.stack[0];
    if (!item) {
        throw new Error('Invalid get_nft_address_by_index response');
    }
    if (item.type === 'num') {
        throw new Error(`Invalid get_nft_address_by_index response: got num instead of address-like stack item`);
    }

    return parseAddress(item);
}
