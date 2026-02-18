# Query & Mutations

AppKit provides a separate entry point `@ton/appkit/queries` that contains standardized options for [TanStack Query](https://tanstack.com/query/latest) (v5).

These options are framework-agnostic and allow you to easily integrate AppKit with TanStack Query in any environment (React, Vue, Svelte, Solid, etc.) to handle caching, background refetching, and state management for blockchain data.

## Features

-   **Separate Entry Point**: logic is isolated in `@ton/appkit/queries` and is not included in the main bundle, keeping your application lightweight if you don't use it.
-   **TanStack Query Integration**: provides `queryOptions` and mutation logic compatible with TanStack Query.
-   **Reusability**: used internally by `@ton/appkit-react`, but can be used to build other wrappers like `appkit-vue` or `appkit-svelte`.

## Usage

You can import query and mutation options directly from the queries entry point:

```typescript
import { getBalanceQueryOptions } from '@ton/appkit/queries';
```

Since these are standard TanStack Query options, you can use them with any adapter. For example, in React:

```typescript
import { useQuery } from '@tanstack/react-query';
import { getBalanceQueryOptions } from '@ton/appkit/queries';

const { data } = useQuery(getBalanceQueryOptions(appKit, { address: '...' }));
```

For more examples of how to use these queries and mutations to build custom hooks, you can check the source code of the [`@ton/appkit-react`](../appkit-react) library.
