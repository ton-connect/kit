---
'@ton/walletkit': patch
'@ton/appkit': patch
'@ton/appkit-react': patch
---

Updated `SwapQuote` and `SwapQuoteParams` types: changed `amount`, `fromAmount`, `toAmount`, and `minReceived` from `TokenAmount` to `string`. This change was made because these fields now contain values already formatted into a human-readable format, whereas `TokenAmount` is intended for nano amounts.
