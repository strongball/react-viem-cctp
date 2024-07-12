import React, { useState } from "react";
import { Box, Button, Paper } from "@mui/material";

import { AvaliableChain } from "../types";
import { getUSDCService } from "../servieMap";
import { Address } from "viem";
import { AttestationsResponse, fetchAttestations } from "../api/circle";
import { sleep } from "../utils";

interface Props {
  source?: AvaliableChain;
  target?: AvaliableChain;
  unit?: string;
}
const TransferProcess: React.FC<Props> = (props) => {
  const { source, target, unit } = props;
  const [stateLogs, setStateLogs] = useState<string[]>([]);
  const [storeMessageBytes, setStoreMessageBytes] = useState<Address>();

  const sourceService = getUSDCService(source);
  const targetService = getUSDCService(target);
  const unitBigInt = unit ? BigInt(unit) : undefined;

  const addLog = (log: string) => {
    setStateLogs((oldValue) => [...oldValue, log]);
  };
  const handleApprove = async () => {
    if (!sourceService || !targetService || !unitBigInt) {
      return;
    }
    addLog("Waiting approve...");
    const hash = await sourceService.approve(unitBigInt);
    addLog(`Approve done. ${hash}`);

    handleDepositForBurn();
  };
  const handleDepositForBurn = async () => {
    if (!sourceService || !targetService || !unitBigInt) {
      return;
    }
    const targetAddress = (await targetService.walletClient.getAddresses())[0];
    addLog("Waiting depositForBurn...");
    addLog(`Target: ${targetAddress}`);
    const messageBytes = await sourceService.depositForBurn(
      unitBigInt,
      targetService.domain,
      targetAddress,
    );
    setStoreMessageBytes(messageBytes);
    addLog(`DepositForBurn done. ${messageBytes}`);
    handleReceive(messageBytes);
  };

  const handleReceive = async (messageBytes: Address) => {
    let attestationsResponse: AttestationsResponse | undefined;
    addLog("Waiting attestations...");
    // eslint-disable-next-line no-constant-condition
    while (true) {
      attestationsResponse = await fetchAttestations(messageBytes);
      if (attestationsResponse?.status === "complete") {
        break;
      }
      await sleep(2000);
    }
    addLog(`Get attestations. ${attestationsResponse.attestation}`);
    addLog("Waiting receiveMessage...");
    await targetService!.receiveMessage(
      messageBytes,
      attestationsResponse.attestation,
    );
    addLog("ReceiveMessage done");
  };

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Button fullWidth variant="contained" onClick={() => handleApprove()}>
        Start
      </Button>
      <Box sx={{ wordBreak: "break-all" }}>
        {stateLogs.map((log, index) => (
          <div key={index}>{log}</div>
        ))}
      </Box>
    </Paper>
  );
};
export default TransferProcess;
