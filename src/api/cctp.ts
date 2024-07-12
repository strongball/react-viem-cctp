import { avalancheFuji, optimismSepolia, sepolia } from "viem/chains";
import { USDCService } from "./USDCService";
import { TestNetDomain } from "./types";
import { AttestationsResponse, fetchAttestations } from "./circle";
import { Address } from "viem";
import { sleep } from "../utils";

const sepoliaUSDCService = new USDCService({
  chain: sepolia,
  tokenAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  tokenMessengerAddress: "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5",
  messageTransmitterAddress: "0x7865fAfC2db2093669d92c0F33AeEF291086BEFD",
});

// const opSepoliaUSDCService = new USDCService({
//   chain: optimismSepolia,
//   tokenAddress: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
//   tokenMessengerAddress: "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5",
//   messageTransmitterAddress: "0x7865fAfC2db2093669d92c0F33AeEF291086BEFD",
// });

const avaxUSDCService = new USDCService({
  chain: avalancheFuji,
  tokenAddress: "0x5425890298aed601595a70ab815c96711a31bc65",
  tokenMessengerAddress: "0xeb08f243e5d3fcff26a9e38ae5520a669f4019d0",
  messageTransmitterAddress: "0xa9fb1b3009dcb79e2fe346c16a604b8fa8ae0a79",
});

export async function testFlow(units: bigint) {
  console.log("approve");
  await sepoliaUSDCService.approve(units);
  console.log("depositForBurn");
  const messageBytes = await sepoliaUSDCService.depositForBurn(
    units,
    TestNetDomain.AvalancheFuji,
    (await avaxUSDCService.walletClient.getAddresses())[0],
  );
  console.log("finish");
  return messageBytes;
}

export async function receive(messageBytes: Address) {
  let attestationsResponse: AttestationsResponse | undefined;
  console.log("wait for attestation");
  // eslint-disable-next-line no-constant-condition
  while (true) {
    attestationsResponse = await fetchAttestations(messageBytes);
    if (attestationsResponse?.status === "complete") {
      break;
    }
    await sleep(2000);
  }
  console.log("receiveMessage");
  await avaxUSDCService.receiveMessage(
    messageBytes,
    attestationsResponse.attestation,
  );
  console.log("finish");
}
