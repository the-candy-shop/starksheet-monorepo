import { useStarknetCall } from "@starknet-react/core";
import BN from "bn.js";
import { useContext, useMemo } from "react";
import { toHex } from "starknet/utils/number";
import { CurrentSheetContext } from "../../contexts/CurrentSheetContext";
import { useSheetContract } from "../../hooks/useSheetContract";
import GreyCell, { GreyCellProps } from "../GreyCell/GreyCell";

export type SheetButtonProps = {
  address: string;
  sx?: GreyCellProps["sx"];
};

function hexToAscii(hex: string): string {
  let str = "";
  for (let n = 0; n < hex.length; n += 2) {
    str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
  }
  return str;
}

export function SheetButton({ address, sx }: SheetButtonProps) {
  const { contract } = useSheetContract(address);
  const { setCurrentSheetAddress, currentSheetAddress } =
    useContext(CurrentSheetContext);

  const { data: sheetNameData } = useStarknetCall({
    contract,
    method: "name",
    args: [],
  }) as unknown as { data: { name: BN } };

  const name = useMemo(
    () => (sheetNameData ? hexToAscii(toHex(sheetNameData.name)) : ""),
    [sheetNameData]
  );

  return (
    <GreyCell
      onClick={() => setCurrentSheetAddress(address)}
      sx={{
        cursor: "pointer",
        color: address === currentSheetAddress ? "black" : "rgba(0,0,0,0.5)",
        width: "146px",
        "& .content": { justifyContent: "center" },
        ...sx,
      }}
    >
      {name}
    </GreyCell>
  );
}
