export async function sleep(timeout?: number) {
  return new Promise((r) => setTimeout(r, timeout));
}
