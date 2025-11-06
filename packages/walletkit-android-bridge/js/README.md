# Android WalletKit Bridge

This package contains the Android-facing JavaScript bridge that mediates between
the native WebView runtime and the cross-platform `@ton/walletkit` library.
The bridge mirrors the architecture used by the iOS implementation while
remaining compatible with the existing Android SDK.

## Folder Structure

```
src/
├── adapters/              # Adapters for Android-specific integrations
├── api/                   # Domain-specific bridge API modules
├── core/                  # Shared state, module loading, and init utilities
├── polyfills/             # WebView polyfills executed before the bridge loads
├── transport/             # Native messaging and diagnostics utilities
├── utils/                 # Pure utility helpers shared across modules
├── types/                 # Centralised TypeScript definitions
├── bridge.ts              # Lightweight entry that wires the API to native
└── index.ts               # Entry point invoked by the build pipeline
```

Each directory has a focused responsibility. Domain modules live under `api/`
and depend only on the shared abstractions exposed by `core/`, `transport/`, and
`utils/`.

## Bridge Lifecycle

1. `index.ts` loads polyfills and then imports `bridge.ts`.
2. `bridge.ts` wires the aggregated `api` object into the transport layer and
   exposes it on `window.walletkitBridge`.
3. The transport layer listens for native calls (`window.__walletkitCall`),
   invokes the appropriate API method, and returns results via the native bridge.
4. `core/initialization` lazily loads WalletKit, sets up storage adapters, and
   emits readiness diagnostics.

## Adding a New API Method

1. Identify the appropriate domain module under `api/`. If none exists, create a
   new module (remember to update `api/index.ts`).
2. Add a strongly typed function, importing only what is needed from `core/`,
   `transport/`, and `utils/`.
3. Update `types/api.ts` with any new argument or response types.
4. Export the method from `api/index.ts` so it is surfaced through the bridge.
5. Provide JSDoc for the new function and accompanying types.
6. Run `npm run build` from `kit/apps/androidkit/js` to ensure compilation
   succeeds.

## Testing

- `npm run build` – builds the production bundles used by the Android SDK.
- Manual regression testing is currently required for native request flows (see
  the project documentation for the canonical QA checklist).

When modifying the bridge, prefer running a local Android SDK build that embeds
the new bundle to validate TonConnect flows, wallet creation, and signing.
