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
     * Indexer-supplied hint for how the attribute should be rendered. Optional and indexer-specific.
     */
    displayType?: string;

    /**
     * Value of the attribute (e.g., "Blue", "Rare")
     */
    value?: string;
}
