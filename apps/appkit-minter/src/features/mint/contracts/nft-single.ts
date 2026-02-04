/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Cell, beginCell, contractAddress, storeStateInit } from '@ton/core';
import type { StateInit, Address } from '@ton/core';

// NFT Single contract bytecode (compiled TEP-62 standard contract)
const NftSingleCodeBoc =
    'te6cckECFQEAAwoAART/APSkE/S88sgLAQIBYgcCAgEgBAMAI7x+f4ARgYuGRlgOS/uAFoICHAIBWAYFABG0Dp4AQgRr4HAAHbXa/gBNhjoaYfph/0gGEAICzgsIAgEgCgkAGzIUATPFljPFszMye1UgABU7UTQ+kD6QNTUMIAIBIA0MABE+kQwcLry4U2AEuQyIccAkl8D4NDTAwFxsJJfA+D6QPpAMfoAMXHXIfoAMfoAMPACBtMf0z+CEF/MPRRSMLqOhzIQRxA2QBXgghAvyyaiUjC64wKCEGk9OVBSMLrjAoIQHARBKlIwuoBMSEQ4BXI6HMhBHEDZAFeAxMjQ1NYIQGgudURK6n1ETxwXy4ZoB1NQwECPwA+BfBIQP8vAPAfZRNscF8uGR+kAh8AH6QNIAMfoAggr68IAboSGUUxWgod4i1wsBwwAgkgahkTbiIML/8uGSIY4+ghBRGkRjyFAKzxZQC88WcSRKFFRGsHCAEMjLBVAHzxZQBfoCFctqEssfyz8ibrOUWM8XAZEy4gHJAfsAEFeUECo4W+IQAIICjjUm8AGCENUydtsQN0UAbXFwgBDIywVQB88WUAX6AhXLahLLH8s/Im6zlFjPFwGRMuIByQH7AJMwMzTiVQLwAwBUFl8GMwHQEoIQqMsArXCAEMjLBVAFzxYk+gIUy2oTyx/LPwHPFsmAQPsAAIYWXwZsInDIywHJcIIQi3cXNSHIy/8D0BPPFhOAQHCAEMjLBVAHzxZQBfoCFctqEssfyz8ibrOUWM8XAZEy4gHJAfsAAfZRN8cF8uGR+kAh8AH6QNIAMfoAggr68IAboSGUUxWgod4i1wsBwwAgkgahkTbiIMIA8uGSIY4+ghAFE42RyFALzxZQC88WcSRLFFRGwHCAEMjLBVAHzxZQBfoCFctqEssfyz8ibrOUWM8XAZEy4gHJAfsAEGeUECo5W+IUAIICjjUm8AGCENUydtsQN0YAbXFwgBDIywVQB88WUAX6AhXLahLLH8s/Im6zlFjPFwGRMuIByQH7AJMwNDTiVQLwA+GNLv4=';

export const NftSingleCodeCell = Cell.fromBase64(NftSingleCodeBoc);

export interface RoyaltyParams {
    royaltyFactor: number; // numerator
    royaltyBase: number; // denominator (usually 1000)
    royaltyAddress: Address;
}

export interface NftSingleData {
    ownerAddress: Address;
    editorAddress: Address;
    contentCell: Cell; // Pre-encoded content cell (on-chain or off-chain)
    royaltyParams: RoyaltyParams;
}

/**
 * Build data cell for NFT Single contract
 */
export function buildSingleNftDataCell(data: NftSingleData): Cell {
    const royaltyCell = beginCell()
        .storeUint(data.royaltyParams.royaltyFactor, 16)
        .storeUint(data.royaltyParams.royaltyBase, 16)
        .storeAddress(data.royaltyParams.royaltyAddress)
        .endCell();

    return beginCell()
        .storeAddress(data.ownerAddress)
        .storeAddress(data.editorAddress)
        .storeRef(data.contentCell)
        .storeRef(royaltyCell)
        .endCell();
}

/**
 * Build StateInit for NFT Single contract
 * Returns stateInit cell and calculated contract address
 */
export function buildSingleNftStateInit(data: NftSingleData) {
    const dataCell = buildSingleNftDataCell(data);

    const stateInit: StateInit = {
        code: NftSingleCodeCell,
        data: dataCell,
    };

    const stateInitCell = beginCell().store(storeStateInit(stateInit)).endCell();

    const address = contractAddress(0, stateInit);

    return {
        stateInit,
        stateInitCell,
        address,
    };
}
