# CLAUDE.md — appkit

## Code conventions

- All file names must be in kebab-case.
- For creating new actions and hooks, use the `add-action-and-hook` skill.

## Imports from walletkit

Never import from `@ton/walletkit` directly in appkit code. Instead, create re-export files under `src/<module>/index.ts` that re-export the needed types and functions from `@ton/walletkit`. All other appkit code should import from these local re-exports. This keeps the walletkit dependency isolated so it can later be replaced with a shared package for kit libraries.
