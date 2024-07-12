import React from "react";
import TransferPage from "./pages/TransferPage";
import { createTheme, ThemeProvider } from "@mui/material";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});
interface Props {}
const App: React.FC<Props> = (props) => {
  return (
    <ThemeProvider theme={darkTheme}>
      <TransferPage />
    </ThemeProvider>
  );
  // const [address, setAddress] = useState<Address>();
  // const [messageBytes, setMessageBytes] = useState<Address>();

  // const updateAddress = async () => {
  //   const a = await getFirstAddress();
  //   setAddress(a);
  // };
  // useEffect(() => {
  //   updateAddress();
  // }, []);

  // const handleLinkWallet = async () => {
  //   await linkWallet();
  //   await updateAddress();
  // };

  // const handleStep1 = async () => {
  //   setMessageBytes(await testFlow(10000n));
  // };
  // const handleStep2 = async () => {
  //   if (messageBytes) {
  //     receive(messageBytes);
  //   }
  // };
  // return (
  //   <div>
  //     <button onClick={() => handleLinkWallet()}>link</button>
  //     {/* <button onClick={() => address && getUSDC(address)}>get usd</button> */}
  //     {/* <button onClick={() => address && approve(address)}>show</button> */}
  //     <button onClick={() => address && handleStep1()}>burn</button>
  //     <button onClick={() => address && handleStep2()}>transfer</button>
  //     <div>{address}</div>
  //     <div>{messageBytes}</div>
  //   </div>
  // );
};
export default App;
