import React from "react";
import { MenuItem, TextField, TextFieldProps } from "@mui/material";

import { AvaliableChain } from "../types";

interface Props {
  value?: AvaliableChain;
  onChange?: (newValue: AvaliableChain) => void;
}
const ChainSelect: React.FC<
  Props & Omit<TextFieldProps, "value" | "onChange">
> = ({ value, onChange, ...props }) => {
  return (
    <TextField
      {...props}
      select
      value={value ?? ""}
      onChange={(newValue) => {
        onChange?.(newValue.target.value as unknown as AvaliableChain);
      }}
    >
      <MenuItem value={AvaliableChain.Sepolia}>Sepolia</MenuItem>
      <MenuItem value={AvaliableChain.AvalancheFuji}>AvalancheFuji</MenuItem>
      <MenuItem value={AvaliableChain.OpSepolia}>Op Sepolia</MenuItem>
      <MenuItem value={AvaliableChain.BaseSepolia}>Base Sepolia</MenuItem>
    </TextField>
  );
};
export default ChainSelect;
