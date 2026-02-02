/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Token image URLs in various sizes for display purposes.
 */
export interface TokenImage {
    /**
     * Original image URL
     * @format url
     */
    url?: string;

    /**
     * Small thumbnail URL (typically 64x64 or similar)
     * @format url
     */
    smallUrl?: string;

    /**
     * Medium-sized image URL (typically 256x256 or similar)
     * @format url
     */
    mediumUrl?: string;

    /**
     * Large image URL (typically 512x512 or higher)
     * @format url
     */
    largeUrl?: string;

    /**
     * Raw image data encoded in Base64
     * @format byte
     */
    data?: string;
}
