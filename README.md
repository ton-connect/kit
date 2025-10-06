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
docker compose -f docker-compose.bridge.yml up -d
# check
curl -I -f -s -o /dev/null -w "%{http_code}\n" http://localhost:9103/metrics
```

### Install and build deps
```bash
pnpm install --frozen-lockfile
pnpm --filter demo-wallet e2e:deps
# (optional) use local bridge url in extension
export VITE_BRIDGE_URL="http://localhost:8081/bridge"
pnpm build
```

### Setup `.env`

```dotenv
WALLET_MNEMONIC=".."
DAPP_URL="https://allure-test-runner.vercel.app/e2e" # (optional) target app url
VITE_BRIDGE_URL="http://localhost:8081/bridge" # (optional) use local bridge url in web app
E2E_SLOW_MO="500" # (optional) Slows down Playwright operations by the specified amount of milliseconds
# (optional) mode extension
E2E_WALLET_SOURCE_EXTENSION="apps/demo-wallet/dist-extension"
# (optional) mode web
E2E_WALLET_SOURCE="http://localhost:5173/"
```

### Run test specs
```bash
pnpm --filter demo-wallet e2e
# or
xvfb-run pnpm --filter demo-wallet e2e
```
