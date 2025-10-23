/**
 * Message type constants for JS Bridge communication
 */

/**
 * Message sent from injected bridge to extension
 */
export const TONCONNECT_BRIDGE_REQUEST = 'TONCONNECT_BRIDGE_REQUEST';

/**
 * Response message from extension to injected bridge
 */
export const TONCONNECT_BRIDGE_RESPONSE = 'TONCONNECT_BRIDGE_RESPONSE';

/**
 * Event message from extension to injected bridge (e.g., disconnect)
 */
export const TONCONNECT_BRIDGE_EVENT = 'TONCONNECT_BRIDGE_EVENT';

/**
 * Message to inject extension ID into page context
 */
export const INJECT_EXTENSION_ID = 'INJECT_EXTENSION_ID';

/**
 * Message to trigger content script injection into iframes
 */
export const INJECT_CONTENT_SCRIPT = 'INJECT_CONTENT_SCRIPT';

/**
 * All message types
 */
export const MESSAGE_TYPES = {
    TONCONNECT_BRIDGE_REQUEST,
    TONCONNECT_BRIDGE_RESPONSE,
    TONCONNECT_BRIDGE_EVENT,
    INJECT_EXTENSION_ID,
    INJECT_CONTENT_SCRIPT,
} as const;

export type MessageType = (typeof MESSAGE_TYPES)[keyof typeof MESSAGE_TYPES];
