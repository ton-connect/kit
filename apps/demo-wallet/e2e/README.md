# demo-wallet E2E

Playwright end-to-end tests for the demo-wallet. The suite is **mock-first**: it runs against
mocked wallet data and never spends real funds, so it is safe to run on every push.

## Layout

| Path | What |
|------|------|
| `ui-tests/` | UI specs (onboarding, dashboard, assets, NFT, history, send, swap, staking, amount formatting). Mock-first — wallet data is stubbed via `page.route`. Web-only flows opt into the `webOnly` fixture and skip in extension mode. |
| `mocks/walletApi.ts` | `page.route` mocks for the wallet's API (Toncenter v3 + rates), plus transfer-emulation / seqno helpers used by the TON Connect transaction flow. |
| `mock-dapp/` | A **self-contained TON Connect dApp** test fixture (raw `@tonconnect/sdk`) served by Vite on `127.0.0.1:5175`. It exposes connect / sendTransaction / signData / signMessage behind buttons and surfaces every result into DOM test ids. Not product code. |
| `mock-dapp-tests/` | Two-tab TON Connect specs: the mock dApp (tab 1) drives the redesigned wallet (tab 2) over the real bridge. Each asserts the modal copy + actions and the protocol response. |
| `ton-connect/` | Drivers for the mock-dApp suite — `MockDapp.ts` (dApp page object) and `mockDappFixture.ts` (two-tab fixture). |
| `demo-wallet/DemoWallet.ts` | The wallet page object (onboarding, the four TON Connect request modals, internal send). |
| `pages/`, `qa/` | Wallet page objects and low-level helpers (context launch, extension id, etc.). |

## Configs

| Config | Runs | Servers |
|--------|------|---------|
| `e2e.config.ts` (default, `pnpm e2e`) | `ui-tests/**` only | demo-wallet dev server |
| `e2e.mockdapp.config.ts` | `mock-dapp-tests/**` | mock dApp `:5175` + demo-wallet `:5173` |

The default config `testIgnore`s the two-tab suite (it has its own servers) and the quarantined
runner specs (see below), so `pnpm e2e` is just the fast mock-first UI suite.

## Running locally

```bash
# Build the workspace deps the app needs (the full `pnpm build` is not required):
pnpm --filter @ton/walletkit build && pnpm --filter @demo/wallet-core build

cd apps/demo-wallet

# UI suite (headless):
ENABLE_HEADLESS=true pnpm e2e

# TON Connect two-tab mock-dApp suite:
ENABLE_HEADLESS=true npx playwright test --config e2e.mockdapp.config.ts
```

`WALLET_MNEMONIC` (a throwaway test seed) is read from `apps/demo-wallet/.env` (gitignored).
Kill stray dev servers on `:5173` / `:5175` before re-running.

## How the TON Connect suite stays fund-free

`sendTransaction` / `signMessage` would normally need a funded wallet and would broadcast
on-chain. The suite avoids both:

- **Mocked balance** (`mockWalletApi`) so the wallet's balance guard lets the request through
  and the modal renders.
- **`VITE_DISABLE_NETWORK_SEND=true`** — the wallet signs and returns the response to the dApp
  over the bridge but skips the on-chain broadcast. No funds move.

The connect handshake and every request ride the real TON Connect bridge.
`VITE_DISABLE_MANIFEST_DOMAIN_CHECK=true` lets the wallet accept the local mock-dApp manifest
(served from `127.0.0.1`, which must be dotted — `localhost` is rejected by the manifest host
guard).

## Allure / TestOps

- The reporter is `allure-playwright`. Every test is bound to its TestOps case by a pinned
  **`@allure.id=<N>` title token** — a DB-level id the adapter parses into the `ALLURE_ID` label
  and strips from the display name. That id takes precedence over the derived path+title hash, so
  the case survives a test **rename, file move, or describe change** — none of which the default
  hash binding survives. (This replaces the earlier `historyId` override, which only groups the
  History/Retries timeline and does **not** affect which case a result attaches to.)
- New test with no case yet: the first upload auto-creates the case and TestOps assigns an id; pin
  that id back into the title (`@allure.id=<N>`) before any rename/move so the case is never
  orphaned.
- The authored suite tree (`parentSuite` / `suite` / `subSuite` / `feature`) and the `automated`
  tag are set as labels in code (the fixtures' `beforeEach`), not by hand in the TMS.
- Wrap logical operations in `allure.step('…')` (see `DemoWallet.ts`) so the TestOps execution
  reads as named steps rather than raw Playwright actions. The reporter runs with `detail: false`,
  so only these authored steps show (Playwright hook/fixture noise is dropped).
- Upload runs in CI only, via secrets — no TestOps endpoint or token lives in this repo.

## Quarantined specs

`connect.spec.ts`, `signData.spec.ts`, `localSendTransaction.spec.ts` and `sendTransaction/**`
drive an external test-runner backend that is currently unavailable. They are excluded via
`testIgnore` in `e2e.config.ts` to keep CI within its time budget; re-enable them once that
backend is restored.
