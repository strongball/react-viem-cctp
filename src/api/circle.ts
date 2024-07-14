import { Address, keccak256 } from "viem";
import { sleep } from "../utils";

const API_KEY = import.meta.env.CIRCLE_API_KEY;
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

export async function waitForAttestations(
  messageBytes: Address,
): Promise<AttestationsResponse> {
  let attestationsResponse: AttestationsResponse | undefined;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    attestationsResponse = await fetchAttestations(messageBytes);
    if (attestationsResponse?.status === "complete") {
      return attestationsResponse;
      break;
    }
    await sleep(2000);
  }
}
