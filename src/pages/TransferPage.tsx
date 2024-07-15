import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useMemo, useState } from "react";
import ChainSelect from "../components/ChainSelect";
import { AvaliableChain } from "../types";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import TransferProcess from "../components/TransferProcess";
import { connectWallet, getFirstAddress } from "../api/viem";
import { Address } from "viem";
import { getUSDCService } from "../servieMap";
import { useBalance } from "../hooks/useBalance";
import HistoryDialog from "../components/HistoryDialog";

interface Props {}
const TransferPage: React.FC<Props> = () => {
  const [walletAddress, setWalletAddress] = useState<Address>();
  const [connectWalletLoading, setConnectWalletLoading] = useState(false);
  const [sourceChain, setSourceChain] = useState<AvaliableChain>();
  const [targetChain, setTargetChain] = useState<AvaliableChain>();
  const [openHistoryChain, setOpenHistoryChain] = useState<AvaliableChain>();
  const [transferAmount, setTransferAmount] = useState<string>("");
  const [isTransferAmountTouch, setIsTransferAmountTouch] = useState(false);

  const isSameChain = sourceChain === targetChain;

  const sourceService = useMemo(
    () => getUSDCService(sourceChain),
    [sourceChain],
  );
  const targetService = useMemo(
    () => getUSDCService(targetChain),
    [targetChain],
  );
  const { balance: sourceBalance, refresh: refreshSourceBalance } = useBalance({
    address: walletAddress,
    service: sourceService,
  });
  const { balance: targetBalance, refresh: refreshTargetBalance } = useBalance({
    address: walletAddress,
    service: targetService,
  });
  const refreshBalance = () => {
    refreshSourceBalance();
    refreshTargetBalance();
  };
  const amountError = useMemo(() => {
    if (!transferAmount) {
      return "Amount can't be empty.";
    }
    const amount = Number(transferAmount);
    const sourceBalanceNumber = sourceBalance ? Number(sourceBalance) : 0;
    if (amount > sourceBalanceNumber) {
      return `Max amount is ${sourceBalanceNumber}.`;
    }
  }, [sourceBalance, transferAmount]);

  useEffect(() => {
    (async () => {
      setWalletAddress(await getFirstAddress());
    })();
  }, []);
  const handleConnectWallet = async () => {
    setConnectWalletLoading(true);
    try {
      const address = await connectWallet();
      setWalletAddress(address);
    } catch (error) {
      // pass
    }
    setConnectWalletLoading(false);
  };

  return (
    <Container maxWidth="xs">
      <Card>
        <CardHeader title="Transfer" />
        <HistoryDialog
          address={walletAddress}
          open={!!openHistoryChain}
          onClose={() => setOpenHistoryChain(undefined)}
          service={getUSDCService(openHistoryChain)}
        />
        <CardContent>
          <Grid container spacing={4}>
            <Grid xs={12}>
              <Button
                fullWidth
                variant="contained"
                disabled={connectWalletLoading}
                onClick={() => handleConnectWallet()}
              >
                Connect Wallet
              </Button>
            </Grid>
            <Grid xs={12}>
              <Typography overflow="hidden" textOverflow="ellipsis">
                {walletAddress}
              </Typography>
            </Grid>
            <Grid xs={12}>
              <ChainSelect
                label="Source"
                placeholder="Source"
                fullWidth
                value={sourceChain}
                onChange={setSourceChain}
                helperText={sourceBalance}
              />
              {sourceChain && (
                <Button onClick={() => setOpenHistoryChain(sourceChain)}>
                  Show history
                </Button>
              )}
            </Grid>
            <Grid xs={12}>
              <ChainSelect
                label="Target"
                placeholder="Target"
                fullWidth
                value={targetChain}
                onChange={setTargetChain}
                helperText={targetBalance}
              />
              {targetChain && (
                <Button onClick={() => setOpenHistoryChain(targetChain)}>
                  Show history
                </Button>
              )}
            </Grid>
            <Grid xs={12}>
              <TextField
                label="Amount"
                placeholder="Amount"
                fullWidth
                value={transferAmount}
                onChange={(e) => {
                  setIsTransferAmountTouch(true);
                  if (Number.isNaN(Number(e.target.value))) {
                    e.preventDefault();
                    return;
                  }
                  setTransferAmount(e.target.value);
                }}
                error={isTransferAmountTouch && !!amountError}
                helperText={isTransferAmountTouch && amountError}
              />
            </Grid>
            <Grid xs={12}>
              <TransferProcess
                disabled={isSameChain || !!amountError}
                walletAddress={walletAddress}
                sourceService={sourceService}
                targetService={targetService}
                transferAmount={transferAmount}
                onFinish={refreshBalance}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Container>
  );
};
export default TransferPage;
