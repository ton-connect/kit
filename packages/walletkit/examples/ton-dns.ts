import { ApiClientToncenter } from '../src';

// eslint-disable-next-line no-console
const logInfo = console.log;
// eslint-disable-next-line no-console
const logError = console.error;

const apiKey = process.env.TONCENTER_API_KEY;
const endpoint = 'https://toncenter.com';
const tonClient = new ApiClientToncenter({
    endpoint,
    apiKey,
});

async function main() {
    const wallet = await tonClient.resolveDnsWallet('tolya.ton');
    logInfo({ wallet });
    const domain = await tonClient.backResolveDnsWallet(wallet!);
    logInfo({ domain });
}

main().catch((error) => {
    logError(error);
    process.exit(1);
});
