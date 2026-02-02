/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { fromNano } from '@ton/core';

import type {
    AddressBook,
    SmartContractExecAction,
    ContractDeployAction as SmartContractDeployAction,
} from '../AccountEvent';
import { toAccount } from '../AccountEvent';
import type { EmulationMessage, ToncenterTransaction } from '../emulation';
import { asAddressFriendly } from '../../../utils/address';
import { Base64ToHex } from '../../../utils/base64';
import { computeStatus } from './TonTransfer';
import type { Hex } from '../../../api/models';

export type SmartContractAction = SmartContractExecAction | SmartContractDeployAction;

export function parseContractActions(
    ownerFriendly: string,
    transactions: Record<string, ToncenterTransaction>,
    addressBook: AddressBook,
): SmartContractAction[] {
    const actions: SmartContractAction[] = [];
    for (const hash of Object.keys(transactions)) {
        const tx = transactions[hash];
        if (asAddressFriendly(tx.account) !== ownerFriendly) continue;
        const status = computeStatus(tx);

        for (const msg of tx.out_msgs || []) {
            if (!msg || !msg.destination) continue;
            if (!msg.opcode) continue;

            const contractAddress = msg.destination;
            const tonAttached = BigInt(Number(msg.value || '0'));
            // For unknown calls we keep raw opcode to match expectations
            const operation = msg.opcode;
            const child = findChildTransactionByInMsgHash(transactions, msg.hash);
            const baseTx: Hex = child ? Base64ToHex(child.hash) : Base64ToHex(tx.hash);

            // SmartContractExec
            const exec: SmartContractExecAction = {
                type: 'SmartContractExec',
                id: Base64ToHex(tx.hash),
                status,
                SmartContractExec: {
                    executor: toAccount(ownerFriendly, addressBook),
                    contract: toContractAccount(contractAddress, addressBook),
                    tonAttached,
                    operation,
                    payload: '',
                },
                simplePreview: {
                    name: 'Smart Contract Execution',
                    description: 'Execution of smart contract',
                    value: `${fromNano(String(tonAttached))} TON`,
                    accounts: [toAccount(ownerFriendly, addressBook), toContractAccount(contractAddress, addressBook)],
                },
                baseTransactions: [baseTx],
            };
            actions.push(exec);
            if (child && isDeploy(child, msg)) {
                const deploy: SmartContractDeployAction = {
                    type: 'ContractDeploy',
                    id: Base64ToHex(child.hash),
                    status: computeStatus(child),
                    ContractDeploy: {
                        address: asAddressFriendly(contractAddress),
                        interfaces: [],
                    },
                    simplePreview: {
                        name: 'Contract Deploy',
                        description: 'Deploying a contract',
                        value: '',
                        accounts: [toContractAccount(contractAddress, addressBook)],
                    },
                    baseTransactions: [baseTx],
                };
                actions.push(deploy);
            }
        }
    }
    return actions;
}

function isDeploy(child: ToncenterTransaction, msg: EmulationMessage): boolean {
    const created = child.orig_status === 'nonexist' && child.end_status === 'active';
    const hasInit = Boolean(msg.init_state) || Boolean(child.in_msg && child.in_msg.init_state);
    return created || hasInit;
}

function findChildTransactionByInMsgHash(
    transactions: Record<string, ToncenterTransaction>,
    inMsgHashBase64: string,
): ToncenterTransaction | null {
    for (const key of Object.keys(transactions)) {
        const t = transactions[key];
        if (t.in_msg && t.in_msg.hash === inMsgHashBase64) return t;
    }
    return null;
}

function toContractAccount(address: string, addressBook: AddressBook) {
    const acc = toAccount(address, addressBook);
    return { ...acc, isWallet: false };
}
