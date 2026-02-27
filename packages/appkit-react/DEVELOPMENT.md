# Development

## Setup

```bash
pnpm install         # Install dependencies
pnpm build           # Build all packages
pnpm appkit dev      # Watch mode for appkit module
pnpm appkit-react dev # Watch mode for appkit-react
pnpm run storybook   # Run Storybook for appkit-react UI development
```

## Code Quality

The testing environment uses both standard linting tools and Storybook for UI isolated tests. Expected coverage and quality parameters are determined similarly to the rest of the monorepo.

```bash
pnpm lint          # lint all packages
pnpm lint:fix      # lint and auto-fix issues
pnpm typecheck     # Check TypeScript types
pnpm quality       # tests with coverage
```

## Building

```bash
pnpm build
```

## Architecture Principles

### Modular Design

Each UI component has a single responsibility and is built to be styled and consumed easily:

- **Components** - Pure UI elements (buttons, modals, dialogs)
- **Features** - Core logic of the library divided into functional sections. Each section encapsulates specific domains (e.g., transaction approvals, settings) and contains hooks and UI components for blockchain interaction.
- **Providers** - State and Context provision to the component tree

### Testing Strategy

- **Storybook** - Visual regression and component isolation testing
- **Integration** - Verified via `apps/appkit-minter` usage

## Contributing

### Adding Features

1. **Identify the component** - Find the right place in the library structure
2. **Use Storybook** - Develop components in isolation
3. **Implement the feature** - Follow existing design systems and patterns
4. **Update types** - Ensure exported TypeScript configurations cover new props
5. **Document** - Update README.md and relevant documentation

### Pull Request Process

1. Create a feature branch
2. Add or update Storybook stories
3. Ensure no TypeScript errors: `pnpm typecheck`
4. Fix any linting issues: `pnpm lint:fix`
5. Submit PR with clear description

## Appkit Minter (QA & E2E Testing)

The `apps/appkit-minter` directory contains a reference implementation showing how to integrate `@ton/appkit-react`:

```bash
pnpm appkit-minter dev
```

### Setup `.env` for Minter tests

If testing End-to-End or running `appkit-minter` locally, configure the `.env` at `apps/appkit-minter/.env`:

```dotenv
# Required: TON API keys for connecting to the network
VITE_TON_API_KEY="your_mainnet_api_key_here"
VITE_TON_API_TESTNET_KEY="your_testnet_api_key_here"
```

## Debugging

### Storybook Development

To work specifically on the UI library:

```bash
cd packages/appkit-react
pnpm run storybook
```
Storybook will be available at `http://localhost:6006`.

### Common Issues

**Component Styles Missing**
- Ensure `import '@ton/appkit-react/styles.css'` is present in your root application.

**Context Not Found**
- Ensure components are wrapped within `AppkitProvider`.


## Release Process

1. Update version in `package.json`
2. Ensure build and Storybook run without issues
3. Commit changes and tag release
4. Publish to npm: `npm publish`
