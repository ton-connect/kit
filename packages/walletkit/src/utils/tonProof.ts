/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { TonProofItemReplySuccess } from '@tonconnect/protocol';
import { Wallet } from '@tonconnect/sdk';
import type { Address } from '@ton/core';
import { ed25519 } from '@noble/curves/ed25519';

import { Hex } from '../types/primitive';
import { Base64ToHex, HexToUint8Array, Uint8ArrayToHex } from './base64';
import { loadTonCore } from '../deps/tonCore';
import { loadTonCrypto } from '../deps/tonCrypto';

interface Domain {
    lengthBytes: number; // uint32 `json:"lengthBytes"`
    value: string; // string `json:"value"`
}

export interface TonProofParsedMessage {
    workchain: number; // int32
    address: Hex; // []byte
    timstamp: number; // int64
    domain: Domain; // Domain
    payload: string; // string
    stateInit: string; // string

    signature?: Hex; // []byte
}

export function SignatureVerify(pubkey: Uint8Array, message: Uint8Array, signature: Uint8Array): boolean {
    return ed25519.verify(signature, message, pubkey);
}

const tonProofPrefix = 'ton-proof-item-v2/';
const tonConnectPrefix = 'ton-connect';

export async function CreateTonProofMessageBytes(message: TonProofParsedMessage): Promise<Uint8Array> {
    const { sha256_sync } = await loadTonCrypto();

    const wc = Buffer.alloc(4);
    wc.writeUInt32BE(message.workchain);

    const ts = Buffer.alloc(8);
    ts.writeBigUInt64LE(BigInt(message.timstamp));

    const dl = Buffer.alloc(4);
    dl.writeUInt32LE(message.domain.lengthBytes);

    const m = Buffer.concat([
        Buffer.from(tonProofPrefix),
        wc,
        HexToUint8Array(message.address),
        dl,
        Buffer.from(message.domain.value),
        ts,
        Buffer.from(message.payload),
    ]);

    const messageHash = sha256_sync(m);

    const fullMes = Buffer.concat([Buffer.from([0xff, 0xff]), Buffer.from(tonConnectPrefix), Buffer.from(messageHash)]);
    const res = sha256_sync(fullMes);
    return Buffer.from(res);
}

export async function ConvertTonProofMessage(
    walletInfo: Wallet,
    tp: TonProofItemReplySuccess,
): Promise<TonProofParsedMessage> {
    const { Address } = await loadTonCore();
    const address = Address.parse(walletInfo.account.address);

    const res: TonProofParsedMessage = {
        workchain: address.workChain,
        address: Uint8ArrayToHex(address.hash),
        domain: {
            lengthBytes: tp.proof.domain.lengthBytes,
            value: tp.proof.domain.value,
        },
        signature: Base64ToHex(tp.proof.signature),
        payload: tp.proof.payload,
        stateInit: walletInfo.account.walletStateInit,
        timstamp: tp.proof.timestamp,
    };
    return res;
}

export function createTonProofMessage({
    address,
    domain,
    payload,
    stateInit,
    timestamp,
}: {
    address: Address;
    domain: Domain;
    payload: string;
    stateInit: string; // base64 boc
    timestamp: number; // unixtime
}): TonProofParsedMessage {
    const res: TonProofParsedMessage = {
        workchain: address.workChain,
        address: Uint8ArrayToHex(address.hash),
        domain: {
            lengthBytes: domain.lengthBytes,
            value: domain.value,
        },
        payload: payload,
        stateInit: stateInit,
        timstamp: timestamp,
    };
    return res;
}
