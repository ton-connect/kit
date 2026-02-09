# AppKit Queries & Mutations

AppKit provides standardized options for [TanStack Query](https://tanstack.com/query/latest) (v5). These options handle caching, background refetching, and state management for your blockchain data.

## Queries

Queries are used for fetching data. Each function returns an object compatible with TanStack Query's `queryOptions`.

### `getBalanceQueryOptions`
Fetches the TON balance for a specific address. Automatically invalidates when transactions occur.

### `getJettonsQueryOptions`
Fetches the list of all Jetton tokens owned by an address.

### `getJettonInfoQueryOptions`
Fetches detailed metadata and info for a specific Jetton Master address.

### `getNFTsQueryOptions`
Fetches all NFT items owned by a specific address.

### `getSwapQuoteQueryOptions`
Fetches updated swap quotes as the user changes swap parameters or as prices fluctuate.

### Example Usage
```typescript
import { useQuery } from '@tanstack/react-query';
import { getBalanceQueryOptions } from '@ton/appkit/queries';

const { data, isLoading } = useQuery(
  getBalanceQueryOptions(appKit, { address: '...' })
);
```

## Mutations

Mutations are used for actions that change state or perform side effects (sending money, connecting wallets).

### Transfers
- `transferTonMutationOptions`: Send TON with built-in state tracking.
- `transferJettonMutationOptions`: Send Jettons with built-in state tracking.
- `transferNftMutationOptions`: Send an NFT with built-in state tracking.

### Swap
- `buildSwapTransactionMutationOptions`: Converts a quote into an active signing request.

### Wallet Control
- `connectMutationOptions`: Handles the flow of selecting and connecting a new wallet.
- `disconnectMutationOptions`: Handles the disconnection flow.

### Signing Requests
- `signTextMutationOptions`: Request a text signature.
- `signBinaryMutationOptions`: Request a binary signature.
- `signCellMutationOptions`: Request a cell signature.

### Example Usage
```typescript
import { useMutation } from '@tanstack/react-query';
import { transferTonMutationOptions } from '@ton/appkit/queries';

const { mutate, isPending } = useMutation(transferTonMutationOptions(appKit));

const handleSend = () => {
  mutate({ recipientAddress: '...', amount: '1.0' });
};
```
