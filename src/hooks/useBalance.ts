import { useEffect, useState } from "react";
import { USDCService } from "../api/USDCService";
import { Address } from "viem";

interface UseBalanceParams {
  address?: Address;
  service?: USDCService;
}
export function useBalance({ address, service }: UseBalanceParams) {
  const [balance, setBalacne] = useState<string>();
  const updateBalance = async () => {
    const balance = await service!.getBalance(address!);
    setBalacne(balance);
  };
  useEffect(() => {
    if (!address || !service) {
      setBalacne(undefined);
      return;
    }
    updateBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, service]);

  return { balance, refresh: updateBalance };
}
