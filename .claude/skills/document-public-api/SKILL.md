---
name: document-public-api
description: How to write JSDoc for public symbols so they appear in the auto-generated reference (`packages/<pkg>/docs/reference.md`). Use whenever adding `@public` to an export or editing the surrounding doc-comment.
---

# Documenting public API for the reference generator

The generator at `docs/reference-generator/` walks every export of `packages/appkit` and `packages/appkit-react`, picks the ones tagged `@public`, and renders them into `packages/<pkg>/docs/reference.md`. The output goes through `docs/template-resolver/` which resolves `%%path#NAME%%` placeholders into real code from `docs/examples/`.

This skill describes exactly which JSDoc tags the generator understands, in what shape, and what the rendered output looks like.

---

## Required tags

Every `@public` symbol **must** also declare:

- `@public` — opt-in marker. Without it the symbol is invisible to the generator.
- `@category <Class | Action | Hook | Component | Type | Constants>` — top-level group (`## Class`, `## Action`, …). The generator validates the value; anything else is an error.
- `@section <Domain>` — second-level group (`### Balances`, `### Connectors and wallets`, …). Free-form string; symbols sharing the same value end up under one heading.

If any of the three is missing, `pnpm docs:reference` aborts with a list of offending symbols.

### Which declaration shape fits each `@category`

| `@category` | Allowed declaration |
| --- | --- |
| `Class` | `export class X { }` |
| `Action` / `Hook` | `export function name(...)` or `export const name = (...) => ...` |
| `Component` | Function returning JSX **or** a `const X = { Sub: …, Sub2: … }` object of FCs (rendered as a compound component) |
| `Type` | `export interface X { }` or `export type X = ...` |
| `Constants` | `export const X = { ... } as const` (or any `export const X = literal`) |

Putting `@category Class` on an interface raises `[X] @category Class requires the symbol to be a class declaration.` at generate time. `Type` and `Constants` are deliberately split so a `const X = {}` cannot accidentally land under "Type" — pick `Constants` for runtime values, `Type` for compile-time-only declarations.

---

## Optional tags

- `@param <name> - <description>` — column row in the parameters table. Description should be a single self-contained sentence with a trailing period.
- `@returns <description>` — appears as `Returns: \`Type\` — <description>.`
- `@example` — inline TS/TSX code block printed under the entry.
- `@sample <dir/path>#<SAMPLE_NAME>` — placeholder that `pnpm docs:template` replaces with the body of a `// SAMPLE_START: NAME … // SAMPLE_END: NAME` block under `docs/examples/`. Multiple `@sample` tags are allowed.
- `@expand <paramName>` — for actions that take an options-bag (`getBalanceByAddress(appKit, options)`), expands the named parameter's fields into extra rows like `options.address`, `options.network`. Without `@expand`, the parameter is shown as one row.
- `@extract` — for type aliases that re-export a type from another package (typically walletkit). The renderer follows the alias to the original `interface` / `type` and uses **its** structure (field table or code block). `@public`/`@category`/`@section` still live on the alias; the source's JSDoc supplies field-level descriptions. See "Re-exporting from walletkit" below.
- `@title <Override>` — override the top-level heading for this single symbol. Rarely needed; usually omit.

`@param` accepts a `{@link X}`-as-type-override at the very start of its description (see below); `@returns` does **not** — see the warning in that section.

---

## Cross-reference syntax: `{@link X}`

`{@link X}` becomes a markdown link to the `#x` anchor in the same reference. It works in two places:

1. **Anywhere in a description** (summary, field doc, `@param` description, `@returns` description). The text reads `... see {@link getBalance} ...` and renders `... see [\`getBalance\`](#getbalance) ...`.

2. **At the very start of `@param` description** — the link is extracted and used as the **Type column** for that row. The text after the link goes into the Description column.

   ```ts
   @param config - {@link AppKitConfig} Networks, connectors, providers and runtime flags.
   ```

   renders as:

   | Parameter | Type | Description |
   | --- | --- | --- |
   | `config`* | [`AppKitConfig`](#appkitconfig) | Networks, connectors, providers and runtime flags. |

   The TS-inferred type is replaced by the link. Use this when the inferred type is verbose or you want a cleaner cell.

   ⚠ **Don't put `{@link X}` at the start of `@returns`.** ts-morph's JSDoc parser interprets a leading `{…}` as a legacy type annotation (`@returns {Type} desc`) and silently drops it from the comment text — both the type-override and the description disappear. Write the description as plain prose; the inferred return type is auto-linked anyway. If you really want to mention a type, put `{@link X}` mid-sentence: `@returns The wallet response carrying …`.

`X` must name another `@public` symbol in the same reference — the generator does not validate this, so a typo or an undocumented target produces a dead link.

---

## Style rules

- **One sentence per description.** Summary, `@param` description, field doc, `@returns` description — all collapse onto one line in the rendered table. Multi-paragraph JSDoc reads as a long ugly run-on. If you need a second clause, join with `;` or `—`.
- **Self-contained sentences after `{@link X}`.** Capitalize the first word, end with a period. Don't write `{@link X} with foo` (renders as Description = `with foo` — fragment); write `{@link X} Foo and bar.`.
- **No bullet lists, no fenced code, no tables in JSDoc descriptions.** They survive the markdown but break table rendering.
- **No outright fabrication.** Don't claim methods or behavior that don't exist in the code; the reference is pulled directly from the JSDoc and any error there ships to readers.

---

## Worked example

```ts
/**
 * Read the Toncoin balance of an arbitrary address — useful for wallets that aren't selected in AppKit (use {@link getBalance} for the selected wallet).
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param options - {@link GetBalanceByAddressOptions} Target address and optional network.
 * @returns Balance in TON as a human-readable decimal string.
 *
 * @sample docs/examples/src/appkit/actions/balances#GET_BALANCE_BY_ADDRESS
 * @expand options
 *
 * @public
 * @category Action
 * @section Balances
 */
export const getBalanceByAddress = async (
    appKit: AppKit,
    options: GetBalanceByAddressOptions,
): Promise<GetBalanceByAddressReturnType> => { /* ... */ };
```

```ts
/**
 * Constructor options for {@link AppKit} — networks, connectors, providers and runtime flags.
 *
 * @public
 * @category Type
 * @section Core
 */
export interface AppKitConfig {
    /** Map of chain id to api-client config; if omitted, AppKit defaults to mainnet only. */
    networks?: NetworkAdapters;

    /** Wallet connectors registered at startup. */
    connectors?: ConnectorInput[];

    /** Default network connectors enforce on new connections; `undefined` to allow any. */
    defaultNetwork?: Network;

    /** Defi/onramp providers registered at startup. */
    providers?: ProviderInput[];

    /** Set to `true` to enable server-side rendering support. */
    ssr?: boolean;
}
```

---

## Re-exporting from walletkit (`@extract`)

Some types live in `@ton/walletkit` but are part of the `@ton/appkit` public API (e.g. `Network`, `NetworkAdapters`, `NetworkConfig`, `ApiClientConfig`). A bare `export { Network } from '@ton/walletkit'` will **not** appear in the appkit reference — `collect.ts` filters out symbols whose declaration lives outside the package. Use a local type alias plus `@extract` to surface them:

```ts
// packages/appkit/src/types/network.ts
import type { NetworkAdapters as WalletkitNetworkAdapters } from '@ton/walletkit';

/**
 * @extract
 * @public
 * @category Type
 * @section Networks
 */
export type NetworkAdapters = WalletkitNetworkAdapters;
```

What happens at generate time:

1. The alias declaration sits in `appkit/src/`, so the package-boundary filter passes it.
2. `@extract` tells `extractType` to follow the alias to the underlying walletkit `interface`/`type` and reuse its shape — fields show up in the reference table, JSDoc on each field is pulled from walletkit.
3. `@public`/`@category`/`@section` are read from the alias (you control where it appears in the appkit reference, not walletkit).
4. If the alias has its own summary on the JSDoc block, that takes precedence over walletkit's.

For declaration-merged symbols (a value + same-named interface, like `Network`), keep the value side as a separate `export const`:

```ts
import type { Network as WalletkitNetwork } from '@ton/walletkit';
import { Network as WalletkitNetworkValue } from '@ton/walletkit';

/**
 * @extract
 * @public
 * @category Type
 * @section Networks
 */
export type Network = WalletkitNetwork;

// Value side — `Network.mainnet()` etc.
export const Network = WalletkitNetworkValue;
```

The cleanest form is a JSDoc-tagged ExportDeclaration — one block tags every symbol inside the same `export { … }`:

```ts
/**
 * @extract
 * @public
 * @category Class
 * @section Swap
 */
export { SwapError, SwapProvider, SwapManager } from '@ton/walletkit';

/**
 * @extract
 * @public
 * @category Type
 * @section Swap
 */
export type { SwapToken, TokenAmount, SwapParams } from '@ton/walletkit';
```

Group symbols by `(category, section)` — one ExportDeclaration per group keeps the JSDoc shared.

**Rebuild walletkit after editing its JSDoc.** ts-morph resolves cross-package symbols through `dist/.../*.d.ts`, not the source `*.ts`, so JSDoc edits in `packages/walletkit/src/...` only land in the reference after `pnpm --filter @ton/walletkit build`. For appkit-only edits (no walletkit changes), `pnpm docs:update` alone is enough.

**Important**: `@extract` does NOT make a wildcard `export * from '@ton/appkit'` (used in appkit-react) leak appkit symbols into appkit-react. Wildcard re-exports cannot carry JSDoc, so they cannot carry `@extract`, so the boundary filter still drops them. The opt-in is local and explicit.

---

## After editing JSDoc

Run `pnpm docs:update` (alias for `pnpm docs:reference && pnpm docs:template`). The first step regenerates `docs/templates/packages/<pkg>/docs/reference.md`; the second resolves `@sample` placeholders into real code blocks and writes the final `packages/<pkg>/docs/reference.md`.

If validation fails, the script prints every problem in one go — fix them all before re-running.

---

## Quick checklist

- [ ] `@public` present
- [ ] `@category` set to one of `Class`, `Action`, `Hook`, `Component`, `Type`, `Constants`
- [ ] `@section` set to a domain string (matches existing entries where appropriate)
- [ ] Summary is one sentence with a trailing period
- [ ] Each `@param` description is one self-contained sentence
- [ ] `{@link X}` only used for symbols that are themselves `@public`
- [ ] `@expand` used for any options-bag parameter you want flattened
- [ ] `@extract` used for type aliases that re-export a walletkit type
- [ ] `@sample` points to a real `// SAMPLE_START: NAME` block in `docs/examples/`
- [ ] `pnpm docs:update` runs cleanly
