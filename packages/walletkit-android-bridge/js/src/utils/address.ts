/**
 * Address helpers for formatting and conversion.
 */

export interface ToUserFriendlyAddressOptions {
  addressParser?: {
    parse(raw: string): { toString(options: { bounceable: boolean; testOnly: boolean }): string };
  };
  isTestnet: boolean;
}

/**
 * Converts a raw TON address into a user-friendly representation.
 */
export function toUserFriendlyAddress(rawAddress: string | null, options: ToUserFriendlyAddressOptions): string | null {
  if (!rawAddress || !options.addressParser) {
    return rawAddress;
  }
  try {
    const addr = options.addressParser.parse(rawAddress);
    return addr.toString({ bounceable: false, testOnly: options.isTestnet });
  } catch (error) {
    console.warn('[walletkitBridge] Failed to parse address:', rawAddress, error);
    return rawAddress;
  }
}

/**
 * Converts a base64-encoded string to a hex string.
 */
export function base64ToHex(base64: string): string {
  try {
    const binaryString = atob(base64);
    let hex = '';
    for (let i = 0; i < binaryString.length; i++) {
      const hexByte = binaryString.charCodeAt(i).toString(16).padStart(2, '0');
      hex += hexByte;
    }
    return hex;
  } catch (error) {
    console.warn('[walletkitBridge] Failed to convert hash to hex:', base64, error);
    return base64;
  }
}
