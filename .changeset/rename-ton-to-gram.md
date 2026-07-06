---
"@ton/walletkit": patch
"@ton/appkit-react": patch
"@ton/mcp": patch
---

Rebrand the native asset display from TON to GRAM across the libraries. Technical identifiers are unchanged for backward compatibility — the `'ton'` token address, `AssetType.ton`, the `"TON"` selector / returned symbols in the MCP tools, field names, locale keys, and the SDK branding ("TON AppKit", TON Connect) are kept.

**@ton/walletkit**

- The native token's `TokenInfo` / jetton metadata now reports `name: 'Gram'` and `symbol: 'GRAM'`.
- The Tonstakers staking provider's stake token is renamed: `stakeToken.ticker` is now `'GRAM'` (was `'TON'`) in both the mainnet and testnet metadata. The token `address` (`'ton'`) and the receive token (`tsTON` / `TUNA`) are unchanged.
- Human-readable transaction previews now read "Gram Transfer", and amounts are labelled `GRAM` (e.g. `1.5 GRAM`) instead of `TON`.
- Also dropped the unused `HumanReadableTx` type from the public exports.

All widgets and components now present the native asset as GRAM instead of TON:

- Balance "Send" labels and the shared low-balance modal read GRAM ("Not enough GRAM", with matching reduce / top-up / gasless messages).
- The staking widget shows GRAM as the native stake token (its ticker comes from the updated `@ton/walletkit` Tonstakers metadata).
- The native-asset icon is now the GRAM mark: added `GramIconCircle` and a `--ta-color-gram` token, rendered by the amount preview and staking balance block. The `TonIcon` / `TonIconCircle` components are kept.
- JSDoc on the swap/staking widget context types (providers) and on the `AppkitUIToken` type now refers to GRAM (documentation only — no API or behavior change).

**@ton/mcp**

- Tool descriptions, docs (README, llms.txt, USAGE_EXAMPLES), and skills now present the native asset as "GRAM (ex. TON)" (e.g. "Send GRAM (ex. TON)", "Get GRAM (ex. TON) balance", amounts rendered as "1.5 GRAM"); raw-unit wording now reads "nano units" instead of "nanoTON".
- Only the coin is renamed: TON Blockchain / network / DNS / TonProof / config references stay "TON".
- The tool API is unchanged: the `"TON"` token selector, returned token symbols, and the `nanoTon` output field stay the same.
