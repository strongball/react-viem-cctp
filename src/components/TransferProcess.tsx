import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from "@mui/material";
import { Address } from "viem";

import { waitForAttestations } from "../api/circle";
import { USDCService } from "../api/USDCService";

enum ProcessState {
  Penging,
  WaitApprove,
  WaitBurn,
  WaitReceive,
  Finish,
}

const ProcessSteps: { value: ProcessState; label: string }[] = [
  { label: "Approve", value: ProcessState.WaitApprove },
  { label: "Burn", value: ProcessState.WaitBurn },
  { label: "Receive", value: ProcessState.WaitReceive },
  { label: "Finish", value: ProcessState.Finish },
];
interface Props {
  disabled?: boolean;
  walletAddress?: Address;
  sourceService?: USDCService;
  targetService?: USDCService;
  transferAmount?: string;
  onFinish?: () => void;
}
const TransferProcess: React.FC<Props> = (props) => {
  const {
    disabled = false,
    walletAddress,
    sourceService,
    targetService,
    transferAmount,
    onFinish,
  } = props;
  const [processState, setProcessState] = useState(ProcessState.Penging);
  const [error, setError] = useState<any>();
  const currentStep = useMemo(
    () => ProcessSteps.findIndex((item) => item.value == processState),
    [processState],
  );

  const [loading, setLoading] = useState(false);
  const [storeMessageBytes, setStoreMessageBytes] = useState<Address>();

  const [stateLogs, setStateLogs] = useState<string[]>([]);
  const addLog = (log: string) => {
    setStateLogs((oldValue) => [
      ...oldValue,
      `[${new Date().toISOString()}] ${log}`,
    ]);
  };

  const handleStart = () => {
    setProcessState(ProcessState.WaitApprove);
  };
  const handleRetry = () => {
    setError(undefined);
    invokeAction();
  };
  const invokeAction = () => {
    switch (processState) {
      case ProcessState.WaitApprove:
        handleApprove();
        break;
      case ProcessState.WaitBurn:
        handleDepositForBurn();
        break;
      case ProcessState.WaitReceive:
        if (storeMessageBytes) {
          handleReceive(storeMessageBytes);
        } else {
          setProcessState(ProcessState.WaitBurn);
        }
        break;
    }
  };
  useEffect(() => {
    invokeAction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processState]);

  const handleApprove = async () => {
    if (!sourceService || !targetService || !transferAmount) {
      return;
    }
    const units = await sourceService.currencyToUnit(transferAmount);
    setLoading(true);
    addLog("Waiting approve...");
    try {
      const hash = await sourceService.approve(units);
      addLog(`Approve done. ${hash}`);
      setProcessState(ProcessState.WaitBurn);
    } catch (error) {
      setError(error);
      addLog(`Approve fail. ${error}`);
    }
    setLoading(false);
  };
  const handleDepositForBurn = async () => {
    if (!sourceService || !targetService || !transferAmount) {
      return;
    }
    const units = await sourceService.currencyToUnit(transferAmount);
    setLoading(true);
    addLog("Waiting depositForBurn...");
    try {
      const targetAddress = (
        await targetService.walletClient.getAddresses()
      )[0];
      addLog(`Target: ${targetAddress}`);
      const messageBytes = await sourceService.depositForBurn(
        units,
        targetService.domain,
        targetAddress,
      );
      setStoreMessageBytes(messageBytes);
      addLog(`DepositForBurn done. ${messageBytes}`);
      setProcessState(ProcessState.WaitReceive);
    } catch (error) {
      setError(error);
      addLog(`DepositForBurn fail. ${error}`);
    }
    setLoading(false);
  };

  const handleReceive = async (messageBytes: Address) => {
    setLoading(true);

    addLog("Waiting attestations...");
    try {
      // eslint-disable-next-line no-constant-condition
      const attestationsResponse = await waitForAttestations(messageBytes);
      addLog(`Get attestations. ${attestationsResponse.attestation}`);
      addLog("Waiting receiveMessage...");
      try {
        await targetService!.receiveMessage(
          messageBytes,
          attestationsResponse.attestation,
        );
        addLog("ReceiveMessage done");
        setProcessState(ProcessState.Finish);
        onFinish?.();
      } catch (error) {
        setError(error);
        addLog(`DepositForBurn fail. ${error}`);
      }
    } catch (error) {
      setError(error);
      addLog(`DepositForBurn fail. ${error}`);
    }
    setLoading(false);
  };

  return (
    <>
      <Button
        sx={{ mb: 4 }}
        fullWidth
        variant="contained"
        disabled={
          disabled ||
          !walletAddress ||
          ![ProcessState.Penging, ProcessState.Finish].includes(processState)
        }
        onClick={() => handleStart()}
      >
        Start
      </Button>
      <Stepper sx={{ mb: 4 }} activeStep={currentStep} alternativeLabel>
        {ProcessSteps.map((step, index) => {
          const matchStep = index === currentStep;
          const hasError = matchStep && error;
          return (
            <Step key={step.value}>
              <StepLabel
                error={hasError}
                icon={
                  loading && matchStep ? (
                    <CircularProgress size={24} />
                  ) : undefined
                }
                optional={
                  hasError ? (
                    <Typography variant="caption" color="error">
                      Click to retry
                    </Typography>
                  ) : undefined
                }
                onClick={handleRetry}
              >
                {step.label}
              </StepLabel>
            </Step>
          );
        })}
      </Stepper>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Box sx={{ wordBreak: "break-all", maxHeight: 300, overflowY: "auto" }}>
          {stateLogs.map((log, index) => (
            <Box key={index} sx={{ mb: 2 }}>
              {log}
            </Box>
          ))}
        </Box>
      </Paper>
    </>
  );
};
export default TransferProcess;
