import {
  Box,
  CircularProgress,
  Dialog,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { USDCService } from "../api/USDCService";
import { Address, formatUnits } from "viem";

interface Props {
  address?: Address;
  open?: boolean;
  onClose?: () => void;
  service?: USDCService;
}
const HistoryDialog: React.FC<Props> = (props) => {
  const { address, open, onClose, service } = props;
  const [logData, setLogData] =
    useState<Awaited<ReturnType<USDCService["getLogs"]>>>();
  const [loading, setLoading] = useState(false);

  const updateLogData = async () => {
    if (!service || !address) {
      setLogData(undefined);
      return;
    }
    setLoading(true);
    try {
      const res = await service.getLogs(address);
      setLogData(res);
    } catch (error) {
      //
    }
    setLoading(false);
  };
  useEffect(() => {
    updateLogData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, service]);

  return (
    <Dialog open={open ?? false} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>History</DialogTitle>
      {loading && (
        <Box textAlign="center">
          <CircularProgress />
        </Box>
      )}
      <List>
        {logData?.logs.map((log) => (
          <ListItem key={log.transactionHash}>
            {log.args.from === address ? (
              <ListItemText
                primary={`Out: ${formatUnits(log.args.value ?? 0n, 6)}`}
                secondary={`to: ${log.args.to}`}
              />
            ) : (
              <ListItemText
                primary={`In: ${formatUnits(log.args.value ?? 0n, 6)}`}
                secondary={`from: ${log.args.from}`}
              />
            )}
          </ListItem>
        ))}
      </List>
    </Dialog>
  );
};
export default HistoryDialog;
