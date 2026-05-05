---
name: add-ui-component
description: How to add a new UI component to appkit-react. Use when creating new React components with styling and storybook.
---

# Adding a New UI Component to AppKit React

This skill describes the rules and patterns for creating new UI components in the `appkit-react` package. Follow these guidelines to ensure consistency, theme support, and maintainability.

## 1. Location and Directory Structure

### 1.1 Placement
- **General Reusable Components**: Place in `packages/appkit-react/src/components/`.
- **Feature-Specific Components**: Place in `packages/appkit-react/src/features/{featureName}/components/`.

### 1.2 Folder Structure
Every component must reside in its own subdirectory named after the component (kebab-case matching the component name).

**Example for `Button`:**
```text
button/
├── index.ts             # Public API export
├── button.tsx           # Main component logic
├── button.stories.tsx   # Storybook documentation
└── button.module.css    # Scoped styles
```

---

## 2. Component Implementation Guidelines

### 2.1 Declaration and Exports
- Use `const`.
- Use `FC` from 'react.
- Use **named exports** only. Do not use default exports.
- Export both the component and its Props interface.

**Example:**
```tsx
export interface ButtonProps extends ComponentProps<'button'> {
    // custom props here
}

export const Button: FC<ButtonProps> = (({ children, className, ...props }) => {
    return <button className={clsx(styles.button, className)} {...props}>{children}</button>;
});
```

### 2.2 TypeScript & Props
- Props should typically inherit from `ComponentProps<'tag'>` (e.g., `'div'`, `'button'`, `'input'`) to support standard HTML attributes.
- Use `clsx` for managing conditional class names.

---

## 3. Styling and Design Tokens

### 3.1 CSS Modules
Always use CSS Modules (`.module.css`) to prevent style leakage.

### 3.2 Design Tokens (Variables)
Use variables defined in `packages/appkit-react/src/styles/index.css`. These ensure the component is theme-aware.

Commonly used variables:
- Colors: `--ta-color-primary`, `--ta-color-text`, `--ta-color-background-secondary`.
- Border Radius: `--ta-border-radius-m`, `--ta-border-radius-xl`.

### 3.3 Typography
To apply standardized font styles, use `composes` to import styles from `packages/appkit-react/src/styles/typography.module.css`.

**Example:**
```css
/* button.module.css */
.button {
  composes: bodySemibold from "../../styles/typography.module.css";
  background-color: var(--ta-color-primary);
  border-radius: var(--ta-border-radius-xl);
  /* ... */
}
```
> [!IMPORTANT]
> Always use relative paths for `composes`. Adjust the number of `../` based on the component's depth.

---

## 4. Reference Implementation

Use `packages/appkit-react/src/components/block` as the canonical reference for:
- `index.ts`
- `block.tsx`
- `block.module.css`
- `block.stories.tsx`
