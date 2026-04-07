# CLAUDE.md

## Project overview

Monorepo for TON blockchain integration libraries: `@ton/walletkit` (core wallet SDK), `@ton/appkit` (app-level kit), `@ton/appkit-react` (React bindings). Uses pnpm workspaces and Turbo.

## Commands

- `pnpm quality` — run after every change, before considering a task complete. This single command runs tests, linting, and typechecking.
- Use `pnpm` for all package management (not npm or yarn).
- To reinstall packages cleanly: `pnpm clean:workspaces && pnpm clean && pnpm i`

## Code conventions

- Prefer keeping files under 200–250 lines. Extract utility functions to a nearby `utils` file and types to a `types` file when it helps.
- Use named exports only. No default exports.

## TypeScript

- Avoid `any` and `unknown`. Use proper types whenever possible.
- `unknown` is acceptable only as a last resort when proper types are truly unavailable.
- `any` is only allowed in tests for deliberately testing invalid input — never use it casually.

## Testing

- Test behaviors, not implementation details.
- Always update existing tests related to your changes.
