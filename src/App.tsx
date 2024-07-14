import React from "react";
import TransferPage from "./pages/TransferPage";
import { createTheme, ThemeProvider } from "@mui/material";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});
interface Props {}
const App: React.FC<Props> = () => {
  return (
    <ThemeProvider theme={darkTheme}>
      <TransferPage />
    </ThemeProvider>
  );
};
export default App;
