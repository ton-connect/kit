# Transaction Component

The `Transaction` component provides a pre-built UI for sending transactions. It handles the loading state, error handling, and success feedback.

## Usage

```tsx
import { Transaction } from '@ton/appkit-ui-react';
import { beginCell } from '@ton/core';
import type { Base64String } from '@ton/walletkit';

function SendTransactionButton() {
    return (
        <Transaction
            getTransactionRequest={async () => ({
                validUntil: Math.floor(Date.now() / 1000) + 600,
                messages: [
                    {
                        address: 'UQ...', // Recipient address
                        amount: '0.1', // Amount in TON
                        // Optional payload
                        // payload: '...' as Base64String
                    },
                ],
            })}
            text="Send TON"
            onSuccess={(result) => {
                console.log('Transaction sent:', result);
            }}
            onError={(error) => {
                console.error('Transaction failed:', error);
            }}
        />
    );
}
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `getTransactionRequest` | `() => Promise<SendTransactionRequest>` | Function that returns the transaction request object. |
| `text` | `string` | Text to display on the button. |
| `onSuccess` | `(result: SendTransactionResult) => void` | Callback function called when the transaction is successfully sent. |
| `onError` | `(error: Error) => void` | Callback function called when the transaction fails. |
| `disabled` | `boolean` | Whether the button is disabled. |
| `className` | `string` | Custom CSS class for the button. |

## Customization

You can customize the appearance by passing a `className` or by wrapping it in your own component. The component uses the internal `Button` component which supports theming.
