/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CliWalletService } from '../services/CliWalletService.js';
import { header, keyValue, tableRows, printResult, printError, dim, successHeader } from '../utils/output.js';
import { withSpinner } from '../utils/spinner.js';

export async function nftListCommand(
    service: CliWalletService,
    limit: number,
    offset: number,
    jsonMode: boolean,
): Promise<void> {
    try {
        const nfts = await withSpinner('Fetching NFTs...', () => service.getNfts(limit, offset));

        const mapped = nfts.map((nft) => ({
            address: nft.address,
            name: nft.name,
            description: nft.description,
            image: nft.image,
            collection: nft.collection,
            attributes: nft.attributes,
            isOnSale: nft.isOnSale,
            isSoulbound: nft.isSoulbound,
        }));

        const data = { success: true, nfts: mapped, count: mapped.length };

        if (jsonMode) {
            printResult(true, data, '');
            return;
        }

        let human = header(`NFTs (${nfts.length})`);
        if (nfts.length > 0) {
            const rows = nfts.map((nft) => [nft.name || 'Unnamed', nft.collection?.name || '-', dim(nft.address)]);
            human += tableRows([[dim('Name'), dim('Collection'), dim('Address')], ...rows]);
        } else {
            human += '  No NFTs found.';
        }

        printResult(false, data, human);
    } catch (error) {
        printError(jsonMode, error instanceof Error ? error.message : 'Unknown error');
    }
}

export async function nftGetCommand(service: CliWalletService, nftAddress: string, jsonMode: boolean): Promise<void> {
    try {
        const nft = await withSpinner('Fetching NFT...', () => service.getNft(nftAddress));

        if (!nft) {
            printError(jsonMode, 'NFT not found');
            return;
        }

        const data = {
            success: true,
            nft: {
                address: nft.address,
                name: nft.name,
                description: nft.description,
                image: nft.image,
                collection: nft.collection,
                attributes: nft.attributes,
                ownerAddress: nft.ownerAddress,
                isOnSale: nft.isOnSale,
                isSoulbound: nft.isSoulbound,
                saleContractAddress: nft.saleContractAddress,
            },
        };

        const human =
            header('NFT Details') +
            keyValue([
                ['Address', nft.address],
                ['Name', nft.name],
                ['Description', nft.description],
                ['Collection', nft.collection?.name],
                ['Owner', nft.ownerAddress],
                ['On Sale', nft.isOnSale ? 'Yes' : 'No'],
                ['Soulbound', nft.isSoulbound ? 'Yes' : 'No'],
                ['Image', nft.image],
            ]);

        printResult(jsonMode, data, human);
    } catch (error) {
        printError(jsonMode, error instanceof Error ? error.message : 'Unknown error');
    }
}

export async function nftSendCommand(
    service: CliWalletService,
    nftAddress: string,
    toAddress: string,
    comment: string | undefined,
    jsonMode: boolean,
): Promise<void> {
    try {
        const result = await withSpinner(`Sending NFT ${nftAddress}...`, () =>
            service.sendNft(nftAddress, toAddress, comment),
        );

        if (!result.success) {
            printError(jsonMode, result.message);
            return;
        }

        const data = {
            success: true,
            message: result.message,
            nftAddress,
            recipient: toAddress,
        };

        const human =
            successHeader('NFT Sent') +
            keyValue([
                ['NFT', nftAddress],
                ['To', toAddress],
                ['Comment', comment],
            ]);

        printResult(jsonMode, data, human);
    } catch (error) {
        printError(jsonMode, error instanceof Error ? error.message : 'Unknown error');
    }
}
