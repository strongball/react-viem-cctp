import { Address, keccak256 } from "viem";
import { API_KEY } from "./consts";

export interface AttestationsResponse {
  attestation: Address;
  status: string;
}
export async function fetchAttestations(messageBytes: Address) {
  const messageHash = keccak256(messageBytes);
  // console.log(keccak256(receipt.blockHash));
  const res: AttestationsResponse = await (
    await fetch(
      `https://iris-api-sandbox.circle.com/attestations/${messageHash}`,
      { headers: { "Circle-Token": API_KEY } },
    )
  ).json();
  return res;
}
