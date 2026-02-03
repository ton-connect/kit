/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// npx tsx examples/ton-staking-local.ts
import 'dotenv/config';

import { fromNano, toNano } from '@ton/core';

import { CONTRACT, EventEmitter, NetworkManager, StakingManager, TonStakersStakingProvider, UnstakeMode } from '../src';
import type { TransactionRequest } from '../src';
import type { WalletSigner, NetworkAdapters } from '../src';
import { ApiClientToncenter, Network, Signer, WalletV5R1Adapter, wrapWalletInterface } from '../src';
import { PoolContract } from '../src';
import { globalLogger, LogLevel } from '../src/core/Logger';

globalLogger.configure({ level: LogLevel.NONE });

// eslint-disable-next-line no-console
const logInfo = console.log;
// eslint-disable-next-line no-console
const logError = console.error;

const mnemonic = process.env[`WALLET_MNEMONIC`]!.trim().split(' ');

async function testEnvironment(signer: WalletSigner, network: Network) {
    const testnet = Network.testnet().chainId == network.chainId;
    const client = new ApiClientToncenter({
        apiKey: testnet ? process.env[`API_KEY_TESTNET`]! : process.env[`API_KEY_MAINNET`]!,
        network,
    });
    const wallet = await wrapWalletInterface(
        await WalletV5R1Adapter.create(signer, { client, network: Network.mainnet() }),
    );
    const userAddress = wallet.getAddress({ testnet });
    return { client, wallet, userAddress, testnet };
}

async function testPool(signer: WalletSigner, network: Network) {
    const { client, userAddress, testnet } = await testEnvironment(signer, network);
    const poolContract = testnet ? CONTRACT.STAKING_CONTRACT_ADDRESS_TESTNET : CONTRACT.STAKING_CONTRACT_ADDRESS;
    const pool = new PoolContract(poolContract, client);
    logInfo(await pool.getCodeVersion());
    const { supply, jettonMinter, minLoan } = await pool.getPoolFullData();
    const stakedBalance = await pool.getStakedBalance(userAddress);
    logInfo({
        supply: fromNano(supply),
        jettonMinter,
        minLoan: fromNano(minLoan),
        stakedBalance: fromNano(stakedBalance),
    });
}

async function testStakingManager(signer: WalletSigner, network: Network) {
    const { client, wallet, userAddress } = await testEnvironment(signer, network);
    const stakingManager = new StakingManager();
    const stakingProvider = new TonStakersStakingProvider(
        new NetworkManager({ networks: { [network.chainId]: client } as NetworkAdapters }),
        new EventEmitter(),
        {},
    );
    stakingManager.registerProvider('tonstakers', stakingProvider);
    stakingManager.setDefaultProvider('tonstakers');
    let balance = await stakingManager.getBalance(userAddress, network);
    logInfo({
        balance,
    });
    let request: TransactionRequest | undefined;
    if (balance.stakedBalance != '0') {
        request = await stakingManager.unstake({
            userAddress,
            amount: balance.stakedBalance,
            network,
            unstakeMode: UnstakeMode.Instant,
        });
    } else {
        request = await stakingManager.stake({
            userAddress,
            amount: toNano(1).toString(),
            network,
        });
    }
    if (request) {
        logInfo({
            messages: request.messages,
        });
        const preview = await wallet.getTransactionPreview(request);
        if (preview.error) {
            logInfo({ preview });
        } else {
            const transaction = await wallet.sendTransaction(request);
            logInfo({ transaction });
        }
        balance = await stakingManager.getBalance(userAddress, network);
        logInfo({
            balance,
        });
    }
}

async function main() {
    const signer = await Signer.fromMnemonic(mnemonic);

    await testPool(signer, Network.mainnet());
    await testPool(signer, Network.testnet());

    await testStakingManager(signer, Network.mainnet());
    await testStakingManager(signer, Network.testnet());
}

main().catch((error) => {
    if (error instanceof Error) {
        logError(error.message);
        logError(error.stack);
    } else {
        logError('Unknown error:', error);
    }
    process.exit(1);
});
