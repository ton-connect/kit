/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from 'vitest';

import type { ToncenterEmulationResponse } from '../types/raw-emulation';
import { mapToncenterEmulationResponse } from './map-emulation';
import { computeMoneyFlow } from '../../../utils/computeMoneyFlow';
import type { ApiClient } from '../../../api/interfaces';

// 32 bytes of 0x00 in base64
const TX_HASH_B64 = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
// 32 bytes of 0x01 in base64
const MSG_HASH_B64 = 'AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE=';
// 32 bytes of 0x02 in base64
const RAND_SEED_B64 = 'AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI=';

const SENDER_RAW = '0:10C1073837B93FDAAD594284CE8B8EFF7B9CF25427440EB2FC682762E1471365';
const RECIPIENT_RAW = '0:E93E7D444180608B8520C00DC664383A387356FB6E16FDDF99DBE5E1415A574B';

const RAW_RESPONSE = {
    mc_block_seqno: 42,
    rand_seed: RAND_SEED_B64,
    is_incomplete: false,
    trace: { tx_hash: TX_HASH_B64, in_msg_hash: null, children: [] },
    transactions: {
        [TX_HASH_B64]: {
            account: SENDER_RAW,
            hash: TX_HASH_B64,
            lt: '100000001',
            now: 1700000000,
            mc_block_seqno: 42,
            trace_external_hash: TX_HASH_B64,
            prev_trans_hash: null,
            prev_trans_lt: null,
            orig_status: 'active',
            end_status: 'active',
            total_fees: '1000000',
            total_fees_extra_currencies: {},
            description: {
                type: 'ord',
                aborted: false,
                destroyed: false,
                credit_first: false,
                is_tock: false,
                installed: false,
                storage_ph: { storage_fees_collected: '0', status_change: 'unchanged' },
                compute_ph: {
                    skipped: false,
                    success: true,
                    msg_state_used: false,
                    account_activated: false,
                    gas_fees: '0',
                    gas_used: '21000',
                    gas_limit: '1000000',
                    mode: 0,
                    exit_code: 0,
                    vm_steps: 100,
                    vm_init_state_hash: '',
                    vm_final_state_hash: '',
                },
                action: {
                    success: true,
                    valid: true,
                    no_funds: false,
                    status_change: 'unchanged',
                    result_code: 0,
                    tot_actions: 1,
                    spec_actions: 0,
                    skipped_actions: 0,
                    msgs_created: 1,
                    action_list_hash: '',
                    tot_msg_size: { cells: '1', bits: '267' },
                },
            },
            block_ref: { workchain: -1, shard: '8000000000000000', seqno: 42 },
            in_msg: null,
            out_msgs: [
                {
                    hash: MSG_HASH_B64,
                    source: SENDER_RAW,
                    destination: RECIPIENT_RAW,
                    value: '1000000000',
                    value_extra_currencies: {},
                    fwd_fee: '1000000',
                    ihr_fee: null,
                    created_lt: '100000002',
                    created_at: '1700000000',
                    opcode: null,
                    ihr_disabled: true,
                    bounce: true,
                    bounced: false,
                    import_fee: null,
                    message_content: {
                        hash: MSG_HASH_B64,
                        body: 'te6cckEBAQEAAgAAAEysuc0=',
                        decoded: null,
                    },
                    init_state: null,
                },
            ],
            account_state_before: {
                hash: TX_HASH_B64,
                balance: '5000000000',
                extra_currencies: null,
                account_status: 'active',
                frozen_hash: null,
                data_hash: null,
                code_hash: null,
            },
            account_state_after: {
                hash: TX_HASH_B64,
                balance: '4000000000',
                extra_currencies: null,
                account_status: 'active',
                frozen_hash: null,
                data_hash: null,
                code_hash: null,
            },
            emulated: true,
        },
    },
    actions: [],
    code_cells: {},
    data_cells: {},
    address_book: {},
    metadata: {},
} as unknown as ToncenterEmulationResponse;

describe('mapToncenterEmulationResponse', () => {
    it('maps all transaction fields to camelCase', () => {
        const rawTx = Object.values(RAW_RESPONSE.transactions)[0];
        const mapped = mapToncenterEmulationResponse(RAW_RESPONSE);
        const mappedTx = Object.values(mapped.transactions)[0];

        const rawFields = Object.keys(rawTx);
        const mappedFields = Object.keys(mappedTx);

        // eslint-disable-next-line no-console
        console.log('raw tx fields   :', rawFields);
        // eslint-disable-next-line no-console
        console.log('mapped tx fields:', mappedFields);
        // eslint-disable-next-line no-console
        console.log(`field count: ${rawFields.length} → ${mappedFields.length}`);

        expect(mappedFields.length).toBe(rawFields.length);
        expect(mappedFields).toEqual([
            'account',
            'hash',
            'lt',
            'now',
            'mcBlockSeqno',
            'traceExternalHash',
            'prevTransHash',
            'prevTransLt',
            'origStatus',
            'endStatus',
            'totalFees',
            'totalFeesExtraCurrencies',
            'description',
            'blockRef',
            'inMsg',
            'outMsgs',
            'accountStateBefore',
            'accountStateAfter',
            'isEmulated',
        ]);
    });

    it('converts hashes from base64 to hex', () => {
        const mapped = mapToncenterEmulationResponse(RAW_RESPONSE);

        expect(mapped.trace.txHash).toMatch(/^0x[0-9a-f]{64}$/);
        expect(mapped.trace.txHash).toBe('0x0000000000000000000000000000000000000000000000000000000000000000');

        const tx = Object.values(mapped.transactions)[0];
        expect(tx.hash).toMatch(/^0x[0-9a-f]{64}$/);
        expect(tx.outMsgs[0].hash).toMatch(/^0x[0-9a-f]{64}$/);
    });

    it('converts addresses to user-friendly format', () => {
        const mapped = mapToncenterEmulationResponse(RAW_RESPONSE);
        const tx = Object.values(mapped.transactions)[0];

        expect(tx.account).not.toBe(SENDER_RAW);
        expect(tx.account).toMatch(/^EQ|UQ/);

        expect(tx.outMsgs[0].source).toMatch(/^EQ|UQ/);
        expect(tx.outMsgs[0].destination).toMatch(/^EQ|UQ/);
    });

    it('maps top-level fields correctly', async () => {
        const mapped = mapToncenterEmulationResponse(RAW_RESPONSE);

        expect(mapped.mcBlockSeqno).toBe(42);
        expect(mapped.isIncomplete).toBe(false);
        expect(mapped.randSeed).toMatch(/^0x[0-9a-f]+$/);
        expect(mapped.actions).toEqual([]);
        expect(mapped.codeCells).toEqual({});
        expect(mapped.dataCells).toEqual({});

        const moneyFlow = await computeMoneyFlow({} as unknown as ApiClient, mapped);
        expect(moneyFlow).toBeDefined();
        expect(moneyFlow.outputs).toBe('1000000000');
        expect(moneyFlow.inputs).toBe('0');
        expect(moneyFlow.ourTransfers).toHaveLength(1);
        expect(moneyFlow.ourTransfers[0].assetType).toBe('ton');
    });

    it('maps out_msg value through', () => {
        const mapped = mapToncenterEmulationResponse(RAW_RESPONSE);
        const tx = Object.values(mapped.transactions)[0];

        expect(tx.inMsg).toBeUndefined();
        expect(tx.outMsgs).toHaveLength(1);
        expect(tx.outMsgs[0].value).toBe('1000000000');
        expect(tx.outMsgs[0].messageContent.body).toBe('te6cckEBAQEAAgAAAEysuc0=');
    });
});
