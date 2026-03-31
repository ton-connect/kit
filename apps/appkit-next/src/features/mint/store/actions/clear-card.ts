/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMinterStore } from '../minter-store';

export const clearCard = (): void => {
    useMinterStore.setState({ currentCard: null, mintError: null });
};
