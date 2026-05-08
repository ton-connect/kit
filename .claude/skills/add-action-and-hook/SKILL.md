---
name: add-action-and-hook
description: How to add a new action and hook to AppKit. Use when creating new getXxx/watchXxx actions and useXxx hooks.
---

# Adding a New Action and Hook to AppKit

This skill describes the end-to-end process of adding a new action (`getXxx` / `watchXxx`) and a corresponding React hook (`useXxx`) to the AppKit library. Follow each step in order, consulting existing examples as reference.

---

## Step 1: Create the Action in `appkit`

There are two types of actions:
- **Get actions** — fetch data asynchronously (`getXxx`). Used for one-time reads.
- **Watch actions** — subscribe to state changes (`watchXxx`). Used when the value can change over time and the UI needs to react.

### 1.1 Study existing actions
Before creating your own, look at similar actions in `packages/appkit/src/actions/` to understand the pattern.

**Get action example:**
`packages/appkit/src/actions/network/get-networks.ts`

**Watch action example:**
`packages/appkit/src/actions/network/watch-networks.ts`
```ts
export const watchNetworks = (appKit: AppKit, parameters: WatchNetworksParameters): WatchNetworksReturnType => {
    const { onChange } = parameters;

    const unsubscribe = appKit.emitter.on(NETWORKS_EVENTS.UPDATED, () => {
        onChange(getNetworks(appKit));
    });

    return unsubscribe; // caller is responsible for cleanup
};
```

### 1.2 Create the action file
Create `packages/appkit/src/actions/<category>/get-xxx.ts` (or `watch-xxx.ts`).

**Get action structure:**
```ts
import type { AppKit } from '../../core/app-kit';

export interface GetXxxOptions { /* ... */ }
export type GetXxxReturnType = Promise<number>;

export const getXxx = async (appKit: AppKit, options: GetXxxOptions = {}): GetXxxReturnType => {
    // All business logic goes here
    return result;
};
```

### 1.3 Export the action
Add exports to `packages/appkit/src/actions/index.ts`:
```ts
export {
    getXxx,
    type GetXxxOptions,
    type GetXxxReturnType,
} from './<category>/get-xxx';
```

### 1.4 Document the action

Add `@public` JSDoc to the action and to `GetXxxOptions` so they show up in the auto-generated reference. Follow the [`document-public-api`](../document-public-api/SKILL.md) skill for the exact tag set, allowed `@category` values, and style rules (one-sentence summaries, `{@link X}` syntax for type cells, `@expand` for options-bag flattening, `@sample` for code examples).

---

## Step 2: Create the Query or Mutation in `appkit` (for get actions only)

Watch actions skip this step entirely — they go directly to the hook (Step 3).

For **get** actions, create a `@tanstack/react-query` integration in `packages/appkit/src/queries/`.

### Query — for reading data (`getXxx`)
Study `packages/appkit/src/queries/balances/get-balance-by-address.ts` as a reference.

Create `packages/appkit/src/queries/<category>/get-xxx.ts`:
```ts
import type { AppKit } from '../../core/app-kit';
import { getXxx } from '../../actions/<category>/get-xxx';
import type { GetXxxOptions, GetXxxReturnType } from '../../actions/<category>/get-xxx';
import type { QueryOptions, QueryParameter } from '../../types/query';
import type { Compute, ExactPartial } from '../../types/utils';
import { filterQueryOptions } from '../../utils';

export type GetXxxErrorType = Error;
export type GetXxxData = GetXxxQueryFnData;
export type GetXxxQueryConfig<selectData = GetXxxData> = Compute<ExactPartial<GetXxxOptions>> &
    QueryParameter<GetXxxQueryFnData, GetXxxErrorType, selectData, GetXxxQueryKey>;

export const getXxxQueryOptions = <selectData = GetXxxData>(
    appKit: AppKit,
    options: GetXxxQueryConfig<selectData> = {},
): GetXxxQueryOptions<selectData> => {
    return {
        ...options.query,
        queryFn: async (context) => {
            const [, parameters] = context.queryKey as [string, GetXxxOptions];
            return getXxx(appKit, parameters);
        },
        queryKey: getXxxQueryKey(options),
    };
};

export type GetXxxQueryFnData = Compute<Awaited<GetXxxReturnType>>;
export const getXxxQueryKey = (options: Compute<ExactPartial<GetXxxOptions>> = {}): GetXxxQueryKey =>
    ['xxx', filterQueryOptions(options)] as const;
export type GetXxxQueryKey = readonly ['xxx', Compute<ExactPartial<GetXxxOptions>>];
export type GetXxxQueryOptions<selectData = GetXxxData> = QueryOptions<
    GetXxxQueryFnData, GetXxxErrorType, selectData, GetXxxQueryKey
>;
```

### Mutation — for write/side-effect actions (`doXxx`)
Study `packages/appkit/src/queries/transaction/transfer-ton.ts` as a reference.

Create `packages/appkit/src/queries/<category>/do-xxx.ts`:
```ts
import type { AppKit } from '../../core/app-kit';
import { doXxx } from '../../actions/<category>/do-xxx';
import type { DoXxxOptions, DoXxxReturnType } from '../../actions/<category>/do-xxx';
import type { MutationOptions } from '../../types/query';
import type { Compute } from '../../types/utils';

export type DoXxxErrorType = Error;
export type DoXxxData = Awaited<DoXxxReturnType>;
export type DoXxxVariables = DoXxxOptions;
export type DoXxxMutationOptions = MutationOptions<DoXxxData, DoXxxErrorType, DoXxxVariables>;

export const doXxxMutationOptions = (appKit: AppKit): DoXxxMutationOptions => ({
    mutationFn: (variables) => doXxx(appKit, variables),
});
```

### Export the query/mutation
Add to `packages/appkit/src/queries/index.ts` under the appropriate category comment:
```ts
// For a query:
export {
    getXxxQueryOptions,
    type GetXxxData,
    type GetXxxErrorType,
    type GetXxxQueryConfig,
} from './<category>/get-xxx';

// For a mutation:
export {
    doXxxMutationOptions,
    type DoXxxData,
    type DoXxxErrorType,
    type DoXxxMutationOptions,
    type DoXxxVariables,
} from './<category>/do-xxx';
```

---

## Step 3: Create the Hook in `appkit-react`

The hook should be a **thin wrapper** — all business logic lives in `appkit`. This design makes it easy to later build `appkit-vue` or other framework adapters.

### Hook from a query (`useXxx`)
Study `packages/appkit-react/src/features/nft/hooks/use-nft.ts` as the canonical reference.

Create `packages/appkit-react/src/features/<category>/hooks/use-xxx.ts`:
```ts
import { getXxxQueryOptions } from '@ton/appkit/queries';
import type { GetXxxData, GetXxxErrorType, GetXxxQueryConfig } from '@ton/appkit/queries';

import { useAppKit } from '../../../hooks/use-app-kit';
import { useQuery } from '../../../libs/query';
import type { UseQueryReturnType } from '../../../libs/query';

export type UseXxxParameters<selectData = GetXxxData> = GetXxxQueryConfig<selectData>;
export type UseXxxReturnType<selectData = GetXxxData> = UseQueryReturnType<selectData, GetXxxErrorType>;

/**
 * Hook to get ...
 */
export const useXxx = <selectData = GetXxxData>(
    parameters: UseXxxParameters<selectData> = {},
): UseXxxReturnType<selectData> => {
    const appKit = useAppKit();
    return useQuery(getXxxQueryOptions(appKit, parameters));
};
```

### Hook from a mutation (`useDoXxx`)
Study `packages/appkit-react/src/features/transaction/hooks/use-transfer-ton.ts` as the canonical reference.

### Hook from a watch action (`useXxx`)
Watch-based hooks use `useSyncExternalStore` directly — no query/mutation involved.
Study `packages/appkit-react/src/features/network/hooks/use-networks.ts` as the canonical reference:

```ts
import { useSyncExternalStore, useCallback } from 'react';
import { getXxx, watchXxx } from '@ton/appkit';
import type { GetXxxReturnType } from '@ton/appkit';

import { useAppKit } from '../../../hooks/use-app-kit';

export type UseXxxReturnType = GetXxxReturnType;

export const useXxx = (): UseXxxReturnType => {
    const appKit = useAppKit();

    const subscribe = useCallback(
        (onChange: () => void) => watchXxx(appKit, { onChange }),
        [appKit],
    );

    const getSnapshot = useCallback(() => getXxx(appKit), [appKit]);

    return useSyncExternalStore(subscribe, getSnapshot, () => initialValue);
};
```

### Export the hook
Add to `packages/appkit-react/src/features/<category>/index.ts`:
```ts
export { useXxx, type UseXxxParameters, type UseXxxReturnType } from './hooks/use-xxx';
```

### Document the hook

Tag the hook (and `UseXxxParameters` / `UseXxxReturnType` if useful) with `@public` JSDoc. Use `@category Hook` and `@section <Domain>`. The full ruleset (required tags, allowed values, `{@link}` linking, `@sample` placeholders) is in the [`document-public-api`](../document-public-api/SKILL.md) skill.

---

## Step 4: Add Examples and Tests

### 4.1 Action example
Create `docs/examples/src/appkit/actions/<category>/get-xxx.ts`:
```ts
import type { AppKit } from '@ton/appkit';
import { getXxx } from '@ton/appkit';

export const getXxxExample = async (appKit: AppKit) => {
    // SAMPLE_START: GET_XXX
    const result = await getXxx(appKit);
    console.log('Result:', result);
    // SAMPLE_END: GET_XXX
};
```

Export it in `docs/examples/src/appkit/actions/<category>/index.ts`.

The `// SAMPLE_START: GET_XXX … // SAMPLE_END: GET_XXX` block is what `@sample docs/examples/src/appkit/actions/<category>#GET_XXX` in the action's JSDoc will pull into the reference (see [`document-public-api`](../document-public-api/SKILL.md)).

### 4.2 Hook example
Create `docs/examples/src/appkit/hooks/<category>/use-xxx.tsx`:
```tsx
import { useXxx } from '@ton/appkit-react';

export const UseXxxExample = () => {
    // SAMPLE_START: USE_XXX
    const { data } = useXxx();
    return <div>Result: {data}</div>;
    // SAMPLE_END: USE_XXX
};
```

Export it in `docs/examples/src/appkit/hooks/<category>/index.ts`.

### 4.3 Write tests
**Important:** Do NOT create a new test file per example. Add tests to the existing `<category>.test.ts` / `<category>.test.tsx` file in the same directory.

**Action test:**
```ts
describe('getXxxExample', () => {
    it('should log the result', async () => {
        vi.spyOn(appKit.networkManager, 'getClient').mockReturnValue({
            getSomeData: vi.fn().mockResolvedValue({ value: 42 }),
        } as any);

        await getXxxExample(appKit);

        expect(consoleSpy).toHaveBeenCalledWith('Result:', 42);
    });
});
```

**Hook test** (add `describe` block inside the existing `describe('... Hooks Examples', ...)`)

If the mock `appKit` in `beforeEach` doesn't have the required mocks (e.g., `getClient`), add them to the shared setup.

---

## Step 5: Update Templates and Docs

The reference at `packages/<pkg>/docs/reference.md` is fully generated from `@public` JSDoc, so once Step 1.4 / Step 3.1 are done your action and hook are already in the reference. The two steps below update the older hand-curated `actions.md` / `hooks.md` listings.

### 5.1 Update action listing
Edit `docs/templates/packages/appkit/docs/actions.md`, add after the nearest related action:
```md
### `getXxx`

Description of what the action does.

%%docs/examples/src/appkit/actions/<category>#GET_XXX%%
```

### 5.2 Update hooks listing
Edit `docs/templates/packages/appkit-react/docs/hooks.md`, add after the nearest related hook:
```md
### `useXxx`

Hook to ...

%%docs/examples/src/appkit/hooks/<category>#USE_XXX%%
```

### 5.3 Run quality check
```bash
pnpm quality
```
All tests and type checks must pass before continuing.

### 5.4 Regenerate documentation
```bash
pnpm docs:update
```
Runs `docs:reference` (regenerates `reference.md` from `@public` JSDoc) followed by `docs:template` (resolves `%%path#SAMPLE%%` placeholders into real code blocks). Verify the resulting `.md` files in `packages/appkit/docs/` and `packages/appkit-react/docs/` were updated.
