import {
  Button,
  Card,
  CardContent,
  Container,
  Select,
  TextField,
} from "@mui/material";
import React, { useState } from "react";
import ChainSelect from "../components/ChainSelect";
import { AvaliableChain } from "../types";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import TransferProcess from "../components/TransferProcess";
import { linkWallet } from "../api/viem";

interface Props {}
const TransferPage: React.FC<Props> = (props) => {
  const [sourceChain, setSourceChain] = useState<AvaliableChain>();
  const [targetChain, setTargetChain] = useState<AvaliableChain>();
  const [unit, setUnit] = useState<string>("");

  return (
    <Container maxWidth="xs">
      <Card>
        <CardContent>
          <Grid container spacing={4}>
            <Grid xs={12}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => linkWallet()}
              >
                Connect Wallet
              </Button>
            </Grid>
            <Grid xs={12}>
              <ChainSelect
                label="source"
                placeholder="source"
                fullWidth
                value={sourceChain}
                onChange={setSourceChain}
              />
            </Grid>
            <Grid xs={12}>
              <ChainSelect
                label="target"
                placeholder="target"
                fullWidth
                value={targetChain}
                onChange={setTargetChain}
              />
            </Grid>
            <Grid xs={12}>
              <TextField
                label="Units"
                placeholder="units"
                fullWidth
                value={unit}
                onChange={(e) => {
                  if (e.target.value.match(/[^0-9]/)) {
                    e.preventDefault();
                    return;
                  }
                  setUnit(e.target.value);
                }}
              />
            </Grid>
            <Grid xs={12}>
              <TransferProcess
                source={sourceChain}
                target={targetChain}
                unit={unit}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Container>
  );
};
export default TransferPage;
