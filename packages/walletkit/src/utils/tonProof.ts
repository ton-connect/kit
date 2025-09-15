import { TonProofItemReplySuccess } from '@tonconnect/protocol';
import { Wallet } from '@tonconnect/sdk';
// import { createHash } from 'crypto'
import { Address } from '@ton/core';
import { sha256_sync } from '@ton/crypto';
import { ed25519 } from '@noble/curves/ed25519';

interface Domain {
    lengthBytes: number; // uint32 `json:"lengthBytes"`
    value: string; // string `json:"value"`
}

export interface TonProofParsedMessage {
    workchain: number; // int32
    address: Uint8Array; // []byte
    timstamp: number; // int64
    domain: Domain; // Domain
    payload: string; // string
    stateInit: string; // string

    signature?: Uint8Array; // []byte
}

export function SignatureVerify(pubkey: Uint8Array, message: Uint8Array, signature: Uint8Array): boolean {
    return ed25519.verify(signature, message, pubkey);
}

const tonProofPrefix = 'ton-proof-item-v2/';
const tonConnectPrefix = 'ton-connect';

export async function CreateTonProofMessageBytes(message: TonProofParsedMessage): Promise<Uint8Array> {
    const wc = Buffer.alloc(4);
    wc.writeUInt32BE(message.workchain);

    const ts = Buffer.alloc(8);
    ts.writeBigUInt64LE(BigInt(message.timstamp));

    const dl = Buffer.alloc(4);
    dl.writeUInt32LE(message.domain.lengthBytes);

    const m = Buffer.concat([
        Buffer.from(tonProofPrefix),
        wc,
        message.address,
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

export function ConvertTonProofMessage(walletInfo: Wallet, tp: TonProofItemReplySuccess): TonProofParsedMessage {
    const address = Address.parse(walletInfo.account.address);

    const res: TonProofParsedMessage = {
        workchain: address.workChain,
        address: address.hash,
        domain: {
            lengthBytes: tp.proof.domain.lengthBytes,
            value: tp.proof.domain.value,
        },
        signature: Buffer.from(tp.proof.signature, 'base64'),
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
        address: address.hash,
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
