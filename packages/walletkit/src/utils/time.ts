export function getUnixtime(): number {
    return Math.floor(Date.now() / 1000);
}
