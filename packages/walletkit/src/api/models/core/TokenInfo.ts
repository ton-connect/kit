/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TokenImage } from './TokenImage';
import type { TokenAnimation } from './TokenAnimation';

/**
 * Display information for a token (TON, Jetton, or NFT).
 */
export interface TokenInfo {
    /**
     * Display name of the token
     */
    name?: string;

    /**
     * Human-readable description of the token
     */
    description?: string;

    /**
     * Token image in various sizes
     */
    image?: TokenImage;

    /**
     * Animated media associated with the token
     */
    animation?: TokenAnimation;

    /**
     * Ticker symbol of the token (e.g., "TON", "USDT")
     */
    symbol?: string;
}
