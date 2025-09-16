# DeFi Connector

Universal TON DeFi API implementation using STON.fi SDK v2.

## Features

- Universal DeFi API specification (UTD-API) v0.3.0 compliance
- STON.fi v2 DEX integration with swap functionality
- TypeScript implementation with Express.js
- Request validation using Zod
- TON Connect compatible message format
- Referral fee support
- Error handling and logging

## Architecture

```
src/
├── index.ts              # Express server entry point
├── types/api.ts          # API type definitions
├── routes/api.routes.ts  # API route handlers
├── services/
│   └── stonfi.service.ts # STON.fi DEX integration
├── middleware/
│   └── error.middleware.ts # Error handling
└── utils/
    └── validation.ts     # Validation utilities
```

## Installation

```bash
pnpm install
```

## Configuration

Set environment variables:

- `PORT` - Server port (default: 4000)
- `NODE_ENV` - Environment (development/production)
- `TON_API_KEY` - TON Center API key (optional)
- `ALLOWED_ORIGINS` - CORS allowed origins

## Usage

### Development
```bash
pnpm run dev
```

### Production
```bash
pnpm run build
pnpm start
```

## API Endpoints

Based on the [STON.fi SDK v2 documentation](https://docs.ston.fi/developer-section/dex/sdk/v2/swap):

### GET `/api/ton/meta`
Get API metadata and specifications.

### GET `/api/ton/actions`
List available DeFi actions (currently supports swap).

### POST `/api/ton/actions/swap/quote`
Get a quote for token swap.

**Request Body:**
```json
{
  "amount_in": "1000000000",
  "token_in": {
    "standard": "ton",
    "address": "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c",
    "decimals": 9,
    "symbol": "TON"
  },
  "token_out": {
    "standard": "jetton", 
    "address": "kQDLvsZol3juZyOAVG8tWsJntOxeEZWEaWCbbSjYakQpuYN5",
    "decimals": 9,
    "symbol": "TestRED"
  },
  "wallet_address": "0:1234...",
  "slippage_bps": "100",
  "chain_id": 2
}
```

### POST `/api/ton/actions/swap/build`
Build executable transaction from quote.

**Request Body:**
```json
{
  "quote_id": "uuid-from-quote-response",
  "wallet_address": "0:1234...",
  "referrer": "0:referrer...",
  "chain_id": 2
}
```

## Supported Swap Types

Following STON.fi v2 patterns:

1. **TON to Jetton**: Uses `getSwapTonToJettonTxParams`
2. **Jetton to Jetton**: Uses `getSwapJettonToJettonTxParams`  
3. **Jetton to TON**: Uses `getSwapJettonToTonTxParams`

## Health Check

```
GET /health
```

Returns server status and version information.

## Error Handling

All errors follow UTD-API format:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

## Production Considerations

- Replace in-memory quote storage with Redis
- Add rate limiting
- Implement proper logging
- Add monitoring and metrics
- Use environment-specific STON.fi contract addresses
- Add comprehensive error handling for all edge cases
