/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Address } from '@ton/core';
import { sha256_sync } from '@ton/crypto';
import { ed25519 } from '@noble/curves/ed25519';

import { HexToUint8Array, Uint8ArrayToHex } from './base64';
import type { Base64String, ProofMessage, Hex } from '../api/models';

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

export async function CreateTonProofMessageBytes(message: ProofMessage): Promise<Uint8Array> {
    const wc = Buffer.alloc(4);
    wc.writeUInt32BE(message.workchain);

    const ts = Buffer.alloc(8);
    ts.writeBigUInt64LE(BigInt(message.timestamp));

    const dl = Buffer.alloc(4);
    dl.writeUInt32LE(message.domain.lengthBytes);

    const m = Buffer.concat([
        Buffer.from(tonProofPrefix),
        wc,
        HexToUint8Array(message.addressHash),
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

export function CreateTonProofMessage({
    address,
    domain,
    payload,
    stateInit,
    timestamp,
}: {
    address: Address;
    domain: Domain;
    payload: string;
    stateInit: Base64String; // base64 boc
    timestamp: number; // unixtime
}): ProofMessage {
    const res: ProofMessage = {
        workchain: address.workChain,
        addressHash: Uint8ArrayToHex(address.hash),
        domain: {
            lengthBytes: domain.lengthBytes,
            value: domain.value,
        },
        payload: payload,
        stateInit: stateInit,
        timestamp: timestamp,
    };
    return res;
}
