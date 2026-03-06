/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address } from '@ton/core';
import { useCallback, useState } from 'react';
import { useAddress, useAppKit, useNetwork, useSendTransaction } from '@ton/appkit-react';
import { getJettonWalletAddressFromClient, getJettonsFromClient, getNftsFromClient, parseUnits } from '@ton/walletkit';

import type { AgentWallet } from '../types';
import {
    cellToBase64,
    buildRenameAgentTransaction,
    createChangeOperatorBody,
    createExtensionActionRequestBody,
    createQueryId,
    createWithdrawAllOutActions,
    getAgentWalletState,
} from '../lib/agentic-wallet';
import type { WithdrawJettonAction, WithdrawNftAction } from '../lib/agentic-wallet';
import { buildUpdatedMetadataCell, extractNameFromMetadata } from '../lib/metadata';
import { parseUint256PublicKey } from '../lib/public-key';

import { ENV_AGENTIC_OWNER_OP_GAS } from '@/core/configs/env';

const JETTON_WITHDRAW_EXECUTION_COST_NANO = 55_000_000n; // 0.055 TON
const NFT_WITHDRAW_EXECUTION_COST_NANO = 110_000_000n; // 0.11 TON

type WithdrawSelection = {
    includeTon?: boolean;
    jettons?: Array<{
        walletAddress: string;
        amount: string;
        decimals?: number;
    }>;
    nfts?: Array<{
        address: string;
    }>;
};

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function parseGasNano(value: string): bigint {
    const parsed = value.trim();
    if (!/^\d+$/.test(parsed)) {
        throw new Error('VITE_AGENTIC_OWNER_OP_GAS must be a nano amount integer');
    }
    return BigInt(parsed);
}

export function useAgentOperations() {
    const appKit = useAppKit();
    const network = useNetwork();
    const ownerAddress = useAddress();
    const gasAmount = parseGasNano(ENV_AGENTIC_OWNER_OP_GAS);

    const { mutateAsync: sendTransaction, isPending: isSendTransactionPending } = useSendTransaction();
    const [activeOperations, setActiveOperations] = useState(0);

    const runWithPending = useCallback(async <T>(operation: () => Promise<T>): Promise<T> => {
        setActiveOperations((current) => current + 1);
        try {
            return await operation();
        } finally {
            setActiveOperations((current) => Math.max(0, current - 1));
        }
    }, []);

    const sendAgentMessage = async (agentAddress: string, payloadB64: string, amountNano: bigint = gasAmount) => {
        if (!network) {
            throw new Error('Network is not selected');
        }

        await sendTransaction({
            network,
            validUntil: Math.floor(Date.now() / 1000) + 600,
            messages: [
                {
                    address: agentAddress,
                    amount: amountNano.toString(),
                    payload: payloadB64,
                },
            ],
        });
    };

    const waitForPublicKey = async (agentAddress: string, expected: bigint) => {
        if (!network) {
            return;
        }

        const client = appKit.networkManager.getClient(network);
        for (let attempt = 0; attempt < 10; attempt += 1) {
            const state = await getAgentWalletState(client, agentAddress);
            const current = state.isInitialized ? state.operatorPublicKey : -1n;
            if (current === expected) {
                return;
            }
            await delay(1500);
        }

        throw new Error('On-chain state is not updated yet. Please refresh in a few seconds');
    };

    const revokeAgentWallet = async (agent: AgentWallet) =>
        runWithPending(async () => {
            const queryId = createQueryId();
            const payload = createChangeOperatorBody(queryId, 0n);
            await sendAgentMessage(agent.address, cellToBase64(payload));
            await waitForPublicKey(agent.address, 0n);
        });

    const changeAgentPublicKey = async (agent: AgentWallet, newPublicKeyInput: string) =>
        runWithPending(async () => {
            const newPublicKey = parseUint256PublicKey(newPublicKeyInput);
            const queryId = createQueryId();
            const payload = createChangeOperatorBody(queryId, newPublicKey);
            await sendAgentMessage(agent.address, cellToBase64(payload));
            await waitForPublicKey(agent.address, newPublicKey);
        });

    const withdrawAllFromAgentWallet = async (agent: AgentWallet, selection?: WithdrawSelection) =>
        runWithPending(async () => {
            if (!ownerAddress) {
                throw new Error('Wallet is not connected');
            }
            if (!network) {
                throw new Error('Network is not selected');
            }

            const owner = Address.parse(ownerAddress);
            const client = appKit.networkManager.getClient(network);

            const jettons: WithdrawJettonAction[] = [];
            const nfts: WithdrawNftAction[] = [];
            const includeTon = selection?.includeTon ?? true;

            if (selection) {
                for (const jetton of selection.jettons ?? []) {
                    const decimals = Number.isFinite(jetton.decimals) ? Number(jetton.decimals) : 9;
                    const amount = parseUnits(jetton.amount, decimals);
                    if (amount <= 0n) {
                        continue;
                    }

                    jettons.push({
                        jettonWalletAddress: Address.parse(jetton.walletAddress),
                        amount,
                    });
                }

                for (const nft of selection.nfts ?? []) {
                    nfts.push({ nftAddress: Address.parse(nft.address) });
                }
            } else {
                const jettonPageLimit = 100;
                for (let page = 0; page < 50; page += 1) {
                    const response = await getJettonsFromClient(client, agent.address, {
                        pagination: {
                            limit: jettonPageLimit,
                            offset: page * jettonPageLimit,
                        },
                    });
                    const pageJettons = response.jettons ?? [];

                    for (const jetton of pageJettons) {
                        const balance = BigInt(jetton.balance);
                        if (balance <= 0n) {
                            continue;
                        }

                        const jettonWalletAddress = await getJettonWalletAddressFromClient(
                            client,
                            jetton.address,
                            agent.address,
                        );
                        jettons.push({
                            jettonWalletAddress: Address.parse(jettonWalletAddress),
                            amount: balance,
                        });
                    }

                    if (pageJettons.length < jettonPageLimit) {
                        break;
                    }
                }

                const nftPageLimit = 100;
                for (let page = 0; page < 50; page += 1) {
                    const response = await getNftsFromClient(client, agent.address, {
                        pagination: {
                            limit: nftPageLimit,
                            offset: page * nftPageLimit,
                        },
                    });
                    const pageNfts = response.nfts ?? [];

                    for (const nft of pageNfts) {
                        nfts.push({ nftAddress: Address.parse(nft.address) });
                    }

                    if (pageNfts.length < nftPageLimit) {
                        break;
                    }
                }
            }

            if (!includeTon && jettons.length === 0 && nfts.length === 0) {
                throw new Error('Select at least one asset to withdraw');
            }

            const totalActions = (includeTon ? 1 : 0) + jettons.length + nfts.length;
            if (totalActions > 255) {
                throw new Error(
                    'Too many assets to withdraw in one transaction. Please reduce jettons/NFTs and retry.',
                );
            }

            const outActions = createWithdrawAllOutActions(owner, { includeTon, jettons, nfts });
            const payload = createExtensionActionRequestBody(createQueryId(), outActions);
            const requiredExecutionNano =
                BigInt(jettons.length) * JETTON_WITHDRAW_EXECUTION_COST_NANO +
                BigInt(nfts.length) * NFT_WITHDRAW_EXECUTION_COST_NANO;
            const agentBalanceNano = BigInt(await client.getBalance(agent.address));
            const missingExecutionNano =
                agentBalanceNano < requiredExecutionNano ? requiredExecutionNano - agentBalanceNano : 0n;
            const attachedAmountNano = gasAmount + missingExecutionNano;

            await sendAgentMessage(agent.address, cellToBase64(payload), attachedAmountNano);
        });

    const renameAgentWallet = async (agent: AgentWallet, newName: string) =>
        runWithPending(async () => {
            if (!network) {
                throw new Error('Network is not selected');
            }

            const client = appKit.networkManager.getClient(network);
            const state = await getAgentWalletState(client, agent.address);
            const updatedContent = buildUpdatedMetadataCell(state.nftItemContent, newName);
            const tx = buildRenameAgentTransaction({
                agentAddress: agent.address,
                queryId: createQueryId(),
                gasAmountNano: gasAmount,
                updatedNftItemContent: updatedContent,
                networkChainId: network.chainId,
            });
            await sendTransaction(tx);

            const expected = newName.trim();
            for (let attempt = 0; attempt < 8; attempt += 1) {
                const updatedState = await getAgentWalletState(client, agent.address);
                const actual = extractNameFromMetadata(updatedState.nftItemContent);
                if (actual === expected) {
                    return;
                }
                await delay(1500);
            }

            throw new Error('Rename transaction sent, but metadata update is not visible yet. Please refresh shortly.');
        });

    return {
        isPending: isSendTransactionPending || activeOperations > 0,
        revokeAgentWallet,
        changeAgentPublicKey,
        withdrawAllFromAgentWallet,
        renameAgentWallet,
    };
}
