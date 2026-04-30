/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from 'vitest';

import type { TonApiMessageConsequences } from '../types/emulation';
import type { TonApiTrace } from '../types/traces';
import { mapTonApiEmulationResponse } from './map-emulation';

const ROOT_HASH = 'rootHashABCDEFGH';
const CHILD_HASH = 'childHashABCDEFG';
const EXT_MSG_HASH = 'extMsgHashABCDEF';
const INT_MSG_HASH = 'intMsgHashABCDEF';

const SENDER = '0:1111111111111111111111111111111111111111111111111111111111111111';
const RECIPIENT = '0:2222222222222222222222222222222222222222222222222222222222222222';

function makeConsequences(trace: TonApiTrace): TonApiMessageConsequences {
    return {
        trace,
        risk: { transfer_all_remaining_balance: false, ton: 100000000, jettons: [], nfts: [] },
        event: {
            event_id: ROOT_HASH,
            timestamp: 1700000000,
            actions: [],
            account: { address: SENDER },
            lt: '1000000',
        },
    };
}

describe('mapTonApiEmulationResponse', () => {
    it('derives outMsgs from children when out_msgs is empty', () => {
        const trace: TonApiTrace = {
            transaction: {
                hash: ROOT_HASH,
                lt: '1000000',
                account: { address: SENDER },
                in_msg: { hash: EXT_MSG_HASH, source: undefined, destination: { address: SENDER } },
                out_msgs: [],
            },
            children: [
                {
                    transaction: {
                        hash: CHILD_HASH,
                        lt: '1000001',
                        account: { address: RECIPIENT },
                        in_msg: {
                            hash: INT_MSG_HASH,
                            source: { address: SENDER },
                            destination: { address: RECIPIENT },
                            value: '100000000',
                        },
                        out_msgs: [],
                    },
                },
            ],
        };

        const result = mapTonApiEmulationResponse(makeConsequences(trace));
        // root tx has no in_msg source (external message)
        const rootTx = Object.values(result.transactions).find((tx) => !tx.inMsg?.source);

        expect(rootTx).toBeDefined();
        expect(rootTx!.outMsgs).toHaveLength(1);
        expect(rootTx!.outMsgs[0].hash).toBeTruthy();
    });

    it('keeps existing out_msgs when already populated', () => {
        const trace: TonApiTrace = {
            transaction: {
                hash: ROOT_HASH,
                lt: '1000000',
                account: { address: SENDER },
                in_msg: { hash: EXT_MSG_HASH, source: undefined, destination: { address: SENDER } },
                out_msgs: [
                    {
                        hash: INT_MSG_HASH,
                        source: { address: SENDER },
                        destination: { address: RECIPIENT },
                        value: '100000000',
                    },
                ],
            },
        };

        const result = mapTonApiEmulationResponse(makeConsequences(trace));
        const rootHashHex = Object.keys(result.transactions)[0];
        const rootTx = result.transactions[rootHashHex];

        expect(rootTx!.outMsgs).toHaveLength(1);
    });

    it('sets isCreditFirst=true for external in_msg (bounce=false)', () => {
        const trace: TonApiTrace = {
            transaction: {
                hash: ROOT_HASH,
                lt: '1000000',
                account: { address: SENDER },
                in_msg: { hash: EXT_MSG_HASH, source: undefined, destination: { address: SENDER }, bounce: false },
                out_msgs: [],
            },
        };

        const result = mapTonApiEmulationResponse(makeConsequences(trace));
        const rootHashHex = Object.keys(result.transactions)[0];
        const rootTx = result.transactions[rootHashHex];

        expect(rootTx!.description.isCreditFirst).toBe(true);
    });

    it('sets isCreditFirst=true for internal in_msg with bounce=false', () => {
        const trace: TonApiTrace = {
            transaction: {
                hash: CHILD_HASH,
                lt: '1000001',
                account: { address: RECIPIENT },
                in_msg: {
                    hash: INT_MSG_HASH,
                    source: { address: SENDER },
                    destination: { address: RECIPIENT },
                    value: '100000000',
                    bounce: false,
                },
                out_msgs: [],
            },
        };

        const result = mapTonApiEmulationResponse(makeConsequences(trace));
        const txHashHex = Object.keys(result.transactions)[0];
        const tx = result.transactions[txHashHex];

        expect(tx!.description.isCreditFirst).toBe(true);
    });

    it('sets isCreditFirst=false for internal in_msg with bounce=true', () => {
        const trace: TonApiTrace = {
            transaction: {
                hash: CHILD_HASH,
                lt: '1000001',
                account: { address: RECIPIENT },
                in_msg: {
                    hash: INT_MSG_HASH,
                    source: { address: SENDER },
                    destination: { address: RECIPIENT },
                    value: '100000000',
                    bounce: true,
                },
                out_msgs: [],
            },
        };

        const result = mapTonApiEmulationResponse(makeConsequences(trace));
        const txHashHex = Object.keys(result.transactions)[0];
        const tx = result.transactions[txHashHex];

        expect(tx!.description.isCreditFirst).toBe(false);
    });
});
