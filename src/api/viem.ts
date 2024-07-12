import {
  Address,
  createPublicClient,
  createWalletClient,
  custom,
  decodeAbiParameters,
  formatUnits,
  getContract,
  hexToBytes,
  http,
  keccak256,
  toHex,
} from "viem";
import { sepolia, avalancheFuji } from "viem/chains";
import { usdcAbi } from "./contracts/usdc";

import "viem/window";
import { tokenMessagerAbi } from "./contracts/tokenMessager";
import { TestNetDomain } from "./types";
import { getTransactionReceipt } from "viem/actions";
import { messageTransmitterAbi } from "./contracts/messageTransmitter";
import { API_KEY } from "./consts";

export function getPublicClient() {
  const client = createPublicClient({
    chain: avalancheFuji,
    transport: http(),
  });
  return client;
}
export function getWalletClient() {
  const walletClient = createWalletClient({
    chain: avalancheFuji,
    transport: custom(window.ethereum!),
  });
  return walletClient;
}

export async function linkWallet() {
  const client = getWalletClient();
  const address = (await client.requestAddresses())?.[0];
  return address;
}

export async function getFirstAddress(): Promise<Address | undefined> {
  const client = getWalletClient();
  const address = (await client.getAddresses())?.[0];
  return address;
}

// // const tokenAddress = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
// // const walletAddress = "0x2DC8E9751E2C48FDB9cFB954c8aBE78D969DD1db";
// // const tokenMessengerAddress = "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5";

// // avax
// const tokenAddress = "0x5425890298aed601595a70ab815c96711a31bc65";
// const walletAddress = "0x2DC8E9751E2C48FDB9cFB954c8aBE78D969DD1db";
// const tokenMessengerAddress = "0xeb08f243e5d3fcff26a9e38ae5520a669f4019d0";
// const messageTransmitterAddress = "0xa9fb1b3009dcb79e2fe346c16a604b8fa8ae0a79";
// const sepoliaMessageTransmitterAddress =
//   "0x7865fAfC2db2093669d92c0F33AeEF291086BEFD";

// export async function getUSDC(address: Address): Promise<string> {
//   const client = getPublicClient();
//   const usdcETHcontract = getContract({
//     address: tokenAddress,
//     abi: usdcAbi,
//     client: client,
//   });
//   const [decimals, balance] = await Promise.all([
//     usdcETHcontract.read.decimals() as Promise<number>,
//     usdcETHcontract.read.balanceOf([address]) as Promise<bigint>,
//   ]);
//   console.log(formatUnits(balance, decimals));
//   return formatUnits(balance, decimals);
// }

// export async function approve(address: Address) {
//   const client = getPublicClient();
//   const walletClient = getWalletClient();
//   const usdcETHcontract = getContract({
//     address: tokenAddress,
//     abi: usdcAbi,
//     client: { public: client, wallet: walletClient },
//   });
//   // const tokenMessengerContract = getContract({
//   //   address: tokenMessengerAddress,
//   //   abi: tokenMessagerAbi,
//   //   client: client,
//   // });
//   // const res = await usdcETHcontract.simulate.approve([address, 100n]);
//   const res = await usdcETHcontract.write.approve(
//     [tokenMessengerAddress, 100n],
//     {
//       account: address,

//     },
//   );
//   console.log(res);
// }

// export async function depositForBurn(address: Address) {
//   const publicClient = getPublicClient();
//   const walletClient = getWalletClient();
//   const tokenMessengerContract = getContract({
//     address: tokenMessengerAddress,
//     abi: tokenMessagerAbi,
//     client: { public: publicClient, wallet: walletClient },
//   });
//   console.log("depositForBurn", address);
//   console.log(
//     await tokenMessengerContract.estimateGas.depositForBurn(
//       [
//         10n,
//         TestNetDomain.Sepolia,
//         toHex(hexToBytes(address, { size: 32 })),
//         tokenAddress,
//       ],
//       {
//         account: address,
//       },
//     ),
//   );
//   const res = await tokenMessengerContract.write.depositForBurn(
//     [
//       10n,
//       TestNetDomain.Sepolia,
//       toHex(hexToBytes(address, { size: 32 })),
//       tokenAddress,
//     ],
//     { account: address },
//   );
//   console.log(res);
//   console.log("done");
//   // console.log(res);
//   // 0x46917ac742d422814f94db7a805de0985333817ee51f193f9eb38511f61a83b6
// }

// export async function transfer(account: Address) {
//   const client = getPublicClient();
//   const walletClient = getWalletClient();
//   const receipt = await getTransactionReceipt(client, {
//     hash: "0x01bb43e0c0a38e7e11c8bd3e51d96497da8d949e247fc2b98a88a1554f49e311",
//   });
//   const eventTopic = keccak256(toHex("MessageSent(bytes)"));
//   const log = receipt.logs.find((l) => l.topics[0] === eventTopic);
//   const messageBytes = decodeAbiParameters([{ type: "bytes" }], log!.data)[0];
//   const messageHash = keccak256(messageBytes as any);
//   console.log(messageHash);
//   // console.log(keccak256(receipt.blockHash));
//   const res: { attestation: Address; status: string } = await (
//     await fetch(
//       `https://iris-api-sandbox.circle.com/attestations/${messageHash}`,
//       {
//         headers: {
//           "Circle-Token": API_KEY,
//         },
//       },
//     )
//   ).json();
//   console.log(res);
//   // const res = {
//   //   attestation:
//   //     "0x6872cd0389123555d347bc7e8fb69c9e1a62aac7e84c9d5332e8a686ba5fb16d7f398a9bd0cd2e3b845916e29081db9e35ed2bf8ceea17d48e23d8341fdcd4cd1b1c8404343e55b89f55343d5b5fc442d2b4ea7535519edb6a7b46a2823bd9c5d264388766d983ce57b18518e2426d81fd81576376cb6e80c43613b7dd296c75181c",
//   //   status: "complete",
//   // } as const;

//   const messageTransmitterContract = getContract({
//     address: sepoliaMessageTransmitterAddress,
//     abi: messageTransmitterAbi,
//     client: {
//       puclic: createPublicClient({
//         chain: sepolia,
//         transport: http(),
//       }),
//       wallet: createWalletClient({
//         chain: sepolia,
//         transport: custom(window.ethereum!),
//       }),
//     },
//   });

//   const rec = await messageTransmitterContract.estimateGas.receiveMessage(
//     [messageBytes, res.attestation],
//     { account: account },
//   );
//   console.log(rec);
//   const rec2 = await messageTransmitterContract.write.receiveMessage(
//     [messageBytes, res.attestation],
//     { account: account },
//   );
//   console.log(rec2);
//   // console.log(response);
// }
