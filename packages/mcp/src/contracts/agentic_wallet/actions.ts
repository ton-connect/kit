/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Address, Cell, MessageRelaxed } from '@ton/core';
import { beginCell, SendMode, storeMessageRelaxed } from '@ton/core';

export class ActionSendMsg {
    public static readonly tag = 0x0ec3c86d;

    public readonly tag = ActionSendMsg.tag;

    constructor(
        public readonly mode: SendMode,
        public readonly outMsg: MessageRelaxed,
    ) {}

    public serialize(): Cell {
        return beginCell()
            .storeUint(this.tag, 32)
            .storeUint(this.mode | SendMode.IGNORE_ERRORS, 8)
            .storeRef(beginCell().store(storeMessageRelaxed(this.outMsg)).endCell())
            .endCell();
    }
}

export class ActionAddExtension {
    public static readonly tag = 0x02;

    public readonly tag = ActionAddExtension.tag;

    constructor(public readonly address: Address) {}

    public serialize(): Cell {
        return beginCell().storeUint(this.tag, 8).storeAddress(this.address).endCell();
    }
}

export class ActionRemoveExtension {
    public static readonly tag = 0x03;

    public readonly tag = ActionRemoveExtension.tag;

    constructor(public readonly address: Address) {}

    public serialize(): Cell {
        return beginCell().storeUint(this.tag, 8).storeAddress(this.address).endCell();
    }
}

export class ActionSetSignatureAuthAllowed {
    public static readonly tag = 0x04;

    public readonly tag = ActionSetSignatureAuthAllowed.tag;

    constructor(public readonly allowed: boolean) {}

    public serialize(): Cell {
        return beginCell()
            .storeUint(this.tag, 8)
            .storeUint(this.allowed ? 1 : 0, 1)
            .endCell();
    }
}

export type OutAction = ActionSendMsg;
export type ExtendedAction = ActionAddExtension | ActionRemoveExtension | ActionSetSignatureAuthAllowed;

export function isExtendedAction(action: OutAction | ExtendedAction): action is ExtendedAction {
    return (
        action.tag === ActionAddExtension.tag ||
        action.tag === ActionRemoveExtension.tag ||
        action.tag === ActionSetSignatureAuthAllowed.tag
    );
}

function packActionsListOut(actions: (OutAction | ExtendedAction)[]): Cell {
    if (actions.length === 0) {
        return beginCell().endCell();
    }

    const [action, ...rest] = actions;

    if (isExtendedAction(action)) {
        throw new Error('Actions bust be in an order: all extended actions, all out actions');
    }

    return beginCell().storeRef(packActionsListOut(rest)).storeSlice(action.serialize().beginParse()).endCell();
}

/**
 * Pack send-message actions into the bare `OutList` head cell the agentic wallet
 * contract expects in its `outActions` field (see `verifyC5Actions`): each node is
 * a single `action_send_msg` (40 bits + 2 refs). This is NOT the w5 combined
 * `(outList, extendedActions)` container — passing that container to the agentic
 * contract fails on-chain with ERROR_INVALID_C5 (nRefs == 1, not 2). Extended
 * actions travel separately in the request's `extraActions` ref.
 */
export function packOutActionList(actions: OutAction[]): Cell | null {
    if (actions.length === 0) {
        return null;
    }
    return packActionsListOut(actions.slice().reverse());
}
