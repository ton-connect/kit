# TonConnect Kit

## Testing

The testing environment uses `vitest` for faster test execution and includes mutation testing to verify test effectiveness, expected coverage and quality parameters are stored in a [quality.config.js](quality.config.js), `jest` is also used for better IDE compatibility.

```bash
pnpm kit check   # lint and test
pnpm kit quality # lint, test with coverage & mutation
```


## E2E

### (optional) Run TON Connect Bridge local
```bash
git clone https://github.com/ton-connect/bridge.git
cd bridge && docker compose -f docker-compose.memory.yml up --build -d
curl -I -f -s -o /dev/null -w "%{http_code}\n" http://localhost:9103/metrics
```

### Install and build deps
```bash
pnpm install --frozen-lockfile
pnpm --filter demo-wallet e2e:deps
pnpm build

VITE_BRIDGE_URL=https://bridge.tonapi.io/bridge pnpm --filter demo-wallet build:extension
# or
VITE_BRIDGE_URL=http://localhost:8081/bridge pnpm --filter demo-wallet build:extension

if [ ! -f apps/demo-wallet/.env ]; then echo "setup WALLET_MNEMONIC=".." in file apps/demo-wallet/.env"; fi
```

### Run test specs
```bash
pnpm --filter demo-wallet e2e
# or
WALLET_MNEMONIC=".." pnpm --filter demo-wallet e2e
# or
xvfb-run pnpm --filter demo-wallet e2e
```
