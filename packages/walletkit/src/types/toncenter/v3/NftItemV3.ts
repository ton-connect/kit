import type { NFTCollectionV3 } from './NFTCollectionV3';
import type { NftItem } from '../NftItem';
import { asAddressFriendly, asMaybeAddressFriendly } from '../../primitive';
import { Base64ToHash } from '../../../utils/base64';
import { toNftCollection } from './NFTCollectionV3';

export interface NftItemV3 {
    address: string;
    auction_contract_address: string;
    code_hash?: string;
    collection: NFTCollectionV3 | null;
    collection_address: string | null;
    content?: { [key: string]: never };
    data_hash?: string;
    index: string;
    init: boolean;
    last_transaction_lt?: string;
    on_sale: boolean;
    owner_address?: string;
    real_owner?: string;
    sale_contract_address?: string;
}

export function toNftItem(data: NftItemV3): NftItem {
    const out: NftItem = {
        address: asAddressFriendly(data.address),
        auctionContractAddress: asMaybeAddressFriendly(data.auction_contract_address),
        codeHash: Base64ToHash(data.code_hash),
        dataHash: Base64ToHash(data.data_hash),
        collection: toNftCollection(data.collection),
        collectionAddress: asMaybeAddressFriendly(data.collection_address),
        index: BigInt(data.index),
        init: data.init,
        onSale: data.on_sale,
        ownerAddress: asMaybeAddressFriendly(data.owner_address),
        realOwner: asMaybeAddressFriendly(data.real_owner),
        saleContractAddress: asMaybeAddressFriendly(data.sale_contract_address),
    };
    if (data.last_transaction_lt) out.lastTransactionLt = BigInt(data.last_transaction_lt);
    if (data.content) out.content = data.content;
    return out;
}
