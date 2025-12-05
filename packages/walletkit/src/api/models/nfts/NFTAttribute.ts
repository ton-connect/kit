/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Attribute/trait of an NFT, commonly used for rarity and properties.
 */
export interface NFTAttribute {
    /**
     * Category or type of the trait (e.g., "Background", "Eyes")
     */
    traitType?: string;

    /**
     * How the attribute should be displayed (e.g., "string", "number", "date")
     */
    displayType?: string;

    /**
     * Value of the attribute (e.g., "Blue", "Rare")
     */
    value?: string;
}
