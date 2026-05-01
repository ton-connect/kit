# CLAUDE.md — appkit-react

## Code conventions

- All file names must be in kebab-case.
- For creating new actions and hooks, use the `add-action-and-hook` skill.
- For creating new UI components, use the `add-ui-component` skill.
- Every component must have a Storybook story (`.stories.tsx`).

## Hook ordering in components and custom hooks

Where possible, group hooks in this order inside component/hook bodies. The goal is top-down dataflow: inputs → data → derivations → side-effects.

1. **Local state** — `useState`, `useRef`, `useReducer`, `useDebounceValue`, and state-like wrappers.
2. **Queries and external readers** — `useQuery`-based hooks, wallet/network selectors (`useAddress`, `useNetwork`, balance hooks, etc.).
3. **Derivations** — `useMemo` and simple computed values derived from local state or query data (e.g. validation, formatted strings, flags).
4. **Mutations** — `useMutation`-based hooks (`useBuildSwapTransaction`, `useSendTransaction`, etc.) and simple flags derived from them.
5. **Callbacks / functions** — `useCallback` and inline handlers.
6. **Effects** — `useEffect`, `useLayoutEffect`.

Exception: tightly coupled values may sit next to each other even if the strict order is broken — e.g. a `useMemo` that exists
only to prepare input for a hook right below it can live next to that hook.

## Styling

- Always use CSS Modules (`.module.css`).
- Use `clsx` for conditional class names.
- Use design tokens from `src/styles/index.css` — never hardcode colors or spacing.
- Use `composes` with relative paths for typography from `src/styles/typography.module.css`.

## i18n

- All user-facing strings must go through the `useI18n` hook (`const { t } = useI18n()`).
- Translations are defined in `src/locales/en.ts` — add new keys there grouped by feature.
- Never hardcode user-facing text in components.
