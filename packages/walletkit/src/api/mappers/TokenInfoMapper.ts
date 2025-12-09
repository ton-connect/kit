/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { JettonInfo } from "../../types/jettons";
import type { TokenInfo as InternalTokenInfo } from "../../types/toncenter/TokenInfo";
import type { TokenInfo } from "../models/core/TokenInfo";
import type { TokenImage } from "../models/core/TokenImage";
import type { TokenAnimation } from "../models/core/TokenAnimation";
import { Mapper } from "./Mapper";

/**
 * Maps JettonInfo or NFT TokenInfo to API TokenInfo model.
 * Extracts image and animation data from both root fields and extra data.
 */
export class TokenInfoMapper extends Mapper<JettonInfo, TokenInfo> {
  private extractImageFromJetton(input: JettonInfo): TokenImage | undefined {
    const metadata = input.metadata;

    if (!input.image && !input.image_data && !metadata) {
      return undefined;
    }

    // Try to extract image URLs from metadata (similar to NFT extra fields)
    const smallUrl = metadata?._image_small as string | undefined;
    const mediumUrl = metadata?._image_medium as string | undefined;
    const largeUrl = metadata?._image_big as string | undefined;
    const contentUrl = metadata?.content_url as string | undefined;

    // Use metadata content_url as fallback for main image URL
    const url = input.image ?? contentUrl;

    if (!url && !input.image_data && !smallUrl && !mediumUrl && !largeUrl) {
      return undefined;
    }

    return {
      url,
      smallUrl,
      mediumUrl,
      largeUrl,
      data: input.image_data,
    };
  }

  private extractImageFromNft(
    input: InternalTokenInfo,
  ): TokenImage | undefined {
    const image = input.image;
    const extra = input.extra;

    if (!image && !extra) {
      return undefined;
    }

    return {
      url: image ?? extra?.content_url,
      smallUrl: extra?._image_small,
      mediumUrl: extra?._image_medium,
      largeUrl: extra?._image_big,
    };
  }

  private extractAnimationFromNft(
    input: InternalTokenInfo,
  ): TokenAnimation | undefined {
    const animation = input.animation ?? input.lottie;
    const extra = input.extra;

    const animationUrl = animation ?? extra?.animation_url ?? extra?.lottie;

    if (!animationUrl) {
      return undefined;
    }

    return { url: animationUrl };
  }

  map(input: JettonInfo): TokenInfo {
    return {
      name: input.name,
      description: input.description,
      symbol: input.symbol,
      image: this.extractImageFromJetton(input),
      isValid: input.verification?.verified, // ????
    };
  }

  /**
   * Maps NFT TokenInfo (from toncenter) to API TokenInfo model.
   */
  mapFromNft(input: InternalTokenInfo): TokenInfo {
    return {
      name: input.name,
      description: input.description,
      symbol: input.symbol,
      image: this.extractImageFromNft(input),
      animation: this.extractAnimationFromNft(input),
      isValid: input.valid,
    };
  }
}
