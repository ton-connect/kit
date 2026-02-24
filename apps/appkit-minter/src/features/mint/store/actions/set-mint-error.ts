/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMinterStore } from '../minter-store';

export const setMintError = (error: string | null): void => {
    useMinterStore.setState({ mintError: error });
};
