/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export type { Wallet, WalletTonInterface, WalletNftInterface, WalletJettonInterface } from './Wallet';
export type { WalletAdapter } from './WalletAdapter';
export type { WalletSigner, ISigner } from './WalletSigner';
export type { BaseProvider, BaseProviderEvents, BaseProviderUpdate } from './BaseProvider';

// Defi interfaces
export type { DefiManagerAPI } from './DefiManagerAPI';
export type { SwapAPI, SwapProviderInterface } from './SwapAPI';
export type { OnrampAPI, OnrampProviderInterface } from './OnrampAPI';
export type { DefiProvider, DefiProviderType } from './DefiProvider';
export type { StakingAPI, StakingProviderInterface } from './StakingAPI';
export type { GaslessAPI, GaslessProviderInterface } from './GaslessAPI';

export type { TONConnectSessionManager } from './TONConnectSessionManager';

// Streaming interfaces
export type { StreamingProvider, StreamingProviderFactory } from './StreamingProvider';
export type { StreamingAPI } from './StreamingAPI';
