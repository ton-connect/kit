/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { beginCell, Dictionary } from '@ton/core';
import type { Cell } from '@ton/core';
import { sha256_sync } from '@ton/crypto';

import { makeSnakeCell } from './snake-cell';

const OFF_CHAIN_CONTENT_PREFIX = 0x01;
const ON_CHAIN_CONTENT_PREFIX = 0x00;
const SNAKE_PREFIX = 0x00;

/**
 * Encode off-chain content for NFT metadata
 * Format: 0x01 prefix + URL as snake cell
 */
export function encodeOffChainContent(content: string): Cell {
    let data = Buffer.from(content);
    const offChainPrefix = Buffer.from([OFF_CHAIN_CONTENT_PREFIX]);
    data = Buffer.concat([offChainPrefix, data]);
    return makeSnakeCell(data);
}

/**
 * NFT metadata for on-chain content
 */
export interface NftMetadata {
    name: string;
    description?: string;
    image?: string;
    imageData?: string; // base64 encoded image data
}

/**
 * Encode on-chain content for NFT metadata
 * Format: 0x00 prefix + Dictionary<SHA256(key), SnakeCell(value)>
 */
export function encodeOnChainContent(metadata: NftMetadata): Cell {
    // Create dictionary with Buffer(32) keys (SHA256 hashes)
    const dict = Dictionary.empty(Dictionary.Keys.Buffer(32), {
        serialize: (src: Cell, builder) => {
            builder.storeRef(src);
        },
        parse: (src) => src.loadRef(),
    });

    // Helper to add a field to dictionary
    const addField = (key: string, value: string) => {
        const keyHash = sha256_sync(key);
        // Value is stored as snake cell with 0x00 prefix
        const valueData = Buffer.concat([Buffer.from([SNAKE_PREFIX]), Buffer.from(value, 'utf-8')]);
        const valueCell = makeSnakeCell(valueData);
        dict.set(keyHash, valueCell);
    };

    // Add metadata fields
    addField('name', metadata.name);

    if (metadata.description) {
        addField('description', metadata.description);
    }

    if (metadata.image) {
        addField('image', metadata.image);
    }

    if (metadata.imageData) {
        addField('image_data', metadata.imageData);
    }

    // Build content cell: 0x00 prefix + dictionary
    return beginCell().storeUint(ON_CHAIN_CONTENT_PREFIX, 8).storeDict(dict).endCell();
}
