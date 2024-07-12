import {
  avalancheFuji,
  baseSepolia,
  optimismSepolia,
  sepolia,
} from "viem/chains";
import { USDCService } from "./api/USDCService";
import { AvaliableChain } from "./types";

export const ServiceMap: { [K in AvaliableChain]: USDCService } = {
  [AvaliableChain.Sepolia]: new USDCService({
    chain: sepolia,
    domain: 0,
    tokenAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    tokenMessengerAddress: "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5",
    messageTransmitterAddress: "0x7865fAfC2db2093669d92c0F33AeEF291086BEFD",
  }),
  [AvaliableChain.AvalancheFuji]: new USDCService({
    chain: avalancheFuji,
    domain: 1,
    tokenAddress: "0x5425890298aed601595a70ab815c96711a31bc65",
    tokenMessengerAddress: "0xeb08f243e5d3fcff26a9e38ae5520a669f4019d0",
    messageTransmitterAddress: "0xa9fb1b3009dcb79e2fe346c16a604b8fa8ae0a79",
  }),
  [AvaliableChain.OpSepolia]: new USDCService({
    chain: optimismSepolia,
    domain: 2,
    tokenAddress: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
    tokenMessengerAddress: "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5",
    messageTransmitterAddress: "0x7865fAfC2db2093669d92c0F33AeEF291086BEFD",
  }),
  [AvaliableChain.BaseSepolia]: new USDCService({
    chain: baseSepolia,
    domain: 6,
    tokenAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    tokenMessengerAddress: "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5",
    messageTransmitterAddress: "0x7865fAfC2db2093669d92c0F33AeEF291086BEFD",
  }),
};

export function getUSDCService(
  avaliableChain?: AvaliableChain,
): USDCService | undefined {
  if (avaliableChain === undefined) {
    return;
  }
  return ServiceMap[avaliableChain];
}
