import { Address, createWalletClient, custom } from "viem";
import "viem/window";
export async function connectWallet() {
  const walletClient = createWalletClient({
    transport: custom(window.ethereum!),
  });
  const address = (await walletClient.requestAddresses())?.[0];
  return address;
}

export async function getFirstAddress(): Promise<Address | undefined> {
  try {
    const walletClient = createWalletClient({
      transport: custom(window.ethereum!),
    });
    const address = (await walletClient.getAddresses())?.[0];
    return address;
  } catch (error) {
    return;
  }
}
