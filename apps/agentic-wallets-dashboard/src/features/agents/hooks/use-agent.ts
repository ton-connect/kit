/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useAgents } from './use-agents';
import { isSameTonAddress } from '../lib/address';

export function useAgent(id: string) {
    const { agents } = useAgents();
    return agents.find((a) => a.id === id || isSameTonAddress(a.id, id) || isSameTonAddress(a.address, id));
}
