/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TransactionRequest, UserFriendlyAddress, Network } from '../../../api/models';
import { globalLogger } from '../../../core/Logger';
import type { NetworkManager } from '../../../core/NetworkManager';
import type { EventEmitter } from '../../../core/EventEmitter';
import { StakingProvider } from '../StakingProvider';
import type {
    StakeParams,
    UnstakeParams,
    StakingBalance,
    StakingInfo,
    StakingQuoteParams,
    StakingQuote,
} from '../types';
import { StakingError, StakingErrorCode } from '../errors';
import type { TonStakersProviderConfig } from './types';

const log = globalLogger.createChild('TonStakersStakingProvider');

export class TonStakersStakingProvider extends StakingProvider {
    private readonly apiUrl?: string;

    constructor(networkManager: NetworkManager, eventEmitter: EventEmitter, config: TonStakersProviderConfig = {}) {
        super(networkManager, eventEmitter);
        this.apiUrl = config.apiUrl;
        log.info('TonStakersStakingProvider initialized', { apiUrl: this.apiUrl });
    }

    async getQuote(params: StakingQuoteParams): Promise<StakingQuote> {
        log.debug('TonStakers quote requested', {
            direction: params.direction,
            amount: params.amount,
            userAddress: params.userAddress,
        });
        throw new StakingError('TonStakers quote is not implemented', StakingErrorCode.UnsupportedOperation);
    }

    async stake(params: StakeParams): Promise<TransactionRequest> {
        log.debug('TonStakers stake requested', { amount: params.amount, userAddress: params.userAddress });
        throw new StakingError('TonStakers staking is not implemented', StakingErrorCode.UnsupportedOperation);
    }

    async unstake(params: UnstakeParams): Promise<TransactionRequest> {
        log.debug('TonStakers unstake requested', { amount: params.amount, userAddress: params.userAddress });
        throw new StakingError('TonStakers unstaking is not implemented', StakingErrorCode.UnsupportedOperation);
    }

    async getBalance(userAddress: UserFriendlyAddress, network?: Network): Promise<StakingBalance> {
        log.debug('TonStakers balance requested', { userAddress, network });
        throw new StakingError('TonStakers balance is not implemented', StakingErrorCode.UnsupportedOperation);
    }

    async getStakingInfo(network?: Network): Promise<StakingInfo> {
        log.debug('TonStakers info requested', { network });
        throw new StakingError('TonStakers info is not implemented', StakingErrorCode.UnsupportedOperation);
    }
}
