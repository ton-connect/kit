package io.ton.walletkit.domain.constants

/**
 * Constants for JSON response field names and special values.
 *
 * These constants represent commonly used field names in JSON responses
 * from the JavaScript bridge layer, including pagination, results, and
 * special values used in transaction parsing.
 */
object ResponseConstants {
    // Common response structure keys
    /**
     * JSON key for response result object/value.
     */
    const val KEY_RESULT = "result"

    /**
     * JSON key for response error object.
     */
    const val KEY_ERROR = "error"

    /**
     * JSON key for error message.
     */
    const val KEY_MESSAGE = "message"

    /**
     * JSON key for signature in sign data responses.
     */
    const val KEY_SIGNATURE = "signature"

    /**
     * JSON key for preview data in requests.
     */
    const val KEY_PREVIEW = "preview"

    /**
     * JSON key for data payload.
     */
    const val KEY_DATA = "data"

    /**
     * JSON key for event object.
     */
    const val KEY_EVENT = "event"

    /**
     * JSON key for reason string.
     */
    const val KEY_REASON = "reason"

    // List/collection response keys
    /**
     * JSON key for items array in list responses.
     */
    const val KEY_ITEMS = "items"

    /**
     * JSON key for limit in pagination.
     */
    const val KEY_LIMIT = "limit"

    // Wallet keys
    /**
     * JSON key for wallet object.
     */
    const val KEY_WALLET = "wallet"

    /**
     * JSON key for wallet address.
     */
    const val KEY_ADDRESS = "address"

    /**
     * JSON key for wallet address (alternative format).
     */
    const val KEY_WALLET_ADDRESS = "walletAddress"

    /**
     * JSON key for public key.
     */
    const val KEY_PUBLIC_KEY = "publicKey"

    /**
     * JSON key for wallet balance.
     */
    const val KEY_BALANCE = "balance"

    /**
     * JSON key for generic value field.
     */
    const val KEY_VALUE = "value"

    /**
     * JSON key for wallet index.
     */
    const val KEY_INDEX = "index"

    // Transaction keys
    /**
     * JSON key for transactions array.
     */
    const val KEY_TRANSACTIONS = "transactions"

    /**
     * JSON key for transaction hash (hex format).
     */
    const val KEY_HASH_HEX = "hash_hex"

    /**
     * JSON key for incoming message object.
     */
    const val KEY_IN_MSG = "in_msg"

    /**
     * JSON key for outgoing messages array.
     */
    const val KEY_OUT_MSGS = "out_msgs"

    /**
     * JSON key for operation code.
     */
    const val KEY_OP_CODE = "op_code"

    /**
     * JSON key for message body.
     */
    const val KEY_BODY = "body"

    // KEY_MESSAGE already defined above - removed duplicate

    /**
     * JSON key for transaction comment.
     */
    const val KEY_COMMENT = "comment"

    /**
     * JSON key for total transaction fees.
     */
    const val KEY_TOTAL_FEES = "total_fees"

    /**
     * JSON key for timestamp (Unix time).
     */
    const val KEY_NOW = "now"

    /**
     * JSON key for masterchain block sequence number.
     */
    const val KEY_MC_BLOCK_SEQNO = "mc_block_seqno"

    /**
     * JSON key for source address (friendly format).
     */
    const val KEY_SOURCE_FRIENDLY = "source_friendly"

    /**
     * JSON key for source address (raw format).
     */
    const val KEY_SOURCE = "source"

    /**
     * JSON key for destination address (friendly format).
     */
    const val KEY_DESTINATION_FRIENDLY = "destination_friendly"

    /**
     * JSON key for destination address (raw format).
     */
    const val KEY_DESTINATION = "destination"

    /**
     * JSON key for amount value.
     */
    const val KEY_AMOUNT = "amount"

    /**
     * JSON key for recipient address.
     */
    const val KEY_TO_ADDRESS = "toAddress"

    /**
     * JSON key for URL parameter.
     */
    const val KEY_URL = "url"

    // Session keys
    /**
     * JSON key for session ID.
     */
    const val KEY_SESSION_ID = "sessionId"

    /**
     * JSON key for dApp name.
     */
    const val KEY_DAPP_NAME = "dAppName"

    /**
     * JSON key for dApp description.
     */
    const val KEY_DAPP_DESCRIPTION = "dAppDescription"

    /**
     * JSON key for dApp domain.
     */
    const val KEY_DOMAIN = "domain"

    /**
     * JSON key for dApp icon URL.
     */
    const val KEY_DAPP_ICON_URL = "dAppIconUrl"

    /**
     * JSON key for creation timestamp.
     */
    const val KEY_CREATED_AT = "createdAt"

    /**
     * JSON key for last activity timestamp.
     */
    const val KEY_LAST_ACTIVITY = "lastActivity"

    /**
     * JSON key for last activity timestamp (alternative format).
     */
    const val KEY_LAST_ACTIVITY_AT = "lastActivityAt"

    /**
     * JSON key for private key (encrypted).
     */
    const val KEY_PRIVATE_KEY = "privateKey"

    // Config keys
    /**
     * JSON key for TON client endpoint.
     */
    const val KEY_TON_CLIENT_ENDPOINT = "tonClientEndpoint"

    /**
     * JSON key for API key.
     */
    const val KEY_API_KEY = "apiKey"

    // Preferences keys
    /**
     * JSON key for active wallet address preference.
     */
    const val KEY_ACTIVE_WALLET_ADDRESS = "activeWalletAddress"

    /**
     * JSON key for last selected network preference.
     */
    const val KEY_LAST_SELECTED_NETWORK = "lastSelectedNetwork"

    // Boolean response keys
    /**
     * JSON key for 'ok' status flag.
     */
    const val KEY_OK = "ok"

    /**
     * JSON key for 'removed' status flag.
     */
    const val KEY_REMOVED = "removed"

    /**
     * JSON key for manifest object.
     */
    const val KEY_MANIFEST = "manifest"

    /**
     * JSON key for permissions array.
     */
    const val KEY_PERMISSIONS = "permissions"

    /**
     * JSON key for request object.
     */
    const val KEY_REQUEST = "request"

    /**
     * JSON key for messages array in transactions.
     */
    const val KEY_MESSAGES = "messages"

    /**
     * JSON key for 'to' address (recipient).
     */
    const val KEY_TO = "to"

    /**
     * JSON key for recipient address (alternative).
     */
    const val KEY_RECIPIENT = "recipient"

    /**
     * JSON key for comment text (alternative).
     */
    const val KEY_TEXT = "text"

    /**
     * JSON key for payload data.
     */
    const val KEY_PAYLOAD = "payload"

    /**
     * JSON key for schema information.
     */
    const val KEY_SCHEMA = "schema"

    /**
     * JSON key for params array.
     */
    const val KEY_PARAMS = "params"

    /**
     * JSON key for schema CRC value.
     */
    const val KEY_SCHEMA_CRC = "schema_crc"

    /**
     * JSON key for network identifier.
     */
    const val KEY_NETWORK = "network"

    /**
     * JSON key for TON API URL.
     */
    const val KEY_TON_API_URL = "tonApiUrl"

    /**
     * JSON key for dApp URL (alternative).
     */
    const val KEY_DAPP_URL_ALT = "dAppUrl"

    /**
     * JSON key for icon URL (alternative).
     */
    const val KEY_ICON_URL_ALT = "iconUrl"

    /**
     * JSON key for manifest URL (alternative).
     */
    const val KEY_MANIFEST_URL_ALT = "manifestUrl"

    /**
     * JSON key for message kind/type.
     */
    const val KEY_KIND = "kind"

    /**
     * JSON key for message type.
     */
    const val KEY_TYPE = "type"

    /**
     * JSON key for message ID.
     */
    const val KEY_ID = "id"

    // Kind/Type values
    /**
     * Value for 'ready' message kind/type.
     */
    const val VALUE_KIND_READY = "ready"

    /**
     * Value for 'event' message kind.
     */
    const val VALUE_KIND_EVENT = "event"

    /**
     * Value for 'response' message kind.
     */
    const val VALUE_KIND_RESPONSE = "response"

    /**
     * Schema type value for text data.
     */
    const val VALUE_SCHEMA_TEXT = "text"

    /**
     * Schema type value for binary data.
     */
    const val VALUE_SCHEMA_BINARY = "binary"

    /**
     * Schema type value for cell data.
     */
    const val VALUE_SCHEMA_CELL = "cell"

    // Special values
    /**
     * Empty TON cell body in base64 format.
     * Used to detect empty messages in transaction parsing.
     */
    const val VALUE_EMPTY_CELL_BODY = "te6ccgEBAQEAAgAAAA=="

    /**
     * Default value for unknown/missing dApp names.
     */
    const val VALUE_UNKNOWN_DAPP = "Unknown dApp"

    /**
     * Default value for unknown strings.
     */
    const val VALUE_UNKNOWN = "unknown"

    /**
     * Default error message for bridge errors without specific message.
     */
    const val ERROR_MESSAGE_DEFAULT = "WalletKit bridge error"
}
