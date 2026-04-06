# CLAUDE.md — appkit-react

## Code conventions

- All file names must be in kebab-case.
- For creating new actions and hooks, use the `add-action-and-hook` skill.
- For creating new UI components, use the `add-ui-component` skill.
- Every component must have a Storybook story (`.stories.tsx`).

## Styling

- Always use CSS Modules (`.module.css`).
- Use `clsx` for conditional class names.
- Use design tokens from `src/styles/index.css` — never hardcode colors or spacing.
- Use `composes` with relative paths for typography from `src/styles/typography.module.css`.

## i18n

- All user-facing strings must go through the `useI18n` hook (`const { t } = useI18n()`).
- Translations are defined in `src/locales/en.ts` — add new keys there grouped by feature.
- Never hardcode user-facing text in components.
