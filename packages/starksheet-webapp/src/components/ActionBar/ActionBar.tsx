import React from "react";
import { Box, BoxProps } from "@mui/material";
import Cell from "../Cell/Cell";
import { CELL_BORDER_WIDTH } from "../../config";
import ContentEditable from "react-contenteditable";
import { buildFormulaDisplay } from "./formula.utils";
import { useStarknet, useStarknetCall } from "@starknet-react/core";
import { useStarkSheetContract } from "../../hooks/useStarkSheetContract";
import SaveButton from "../SaveButton/SaveButton";

export type ActionBarProps = {
  selectedCell: { name: string; id: number } | null;
  owner: string | undefined;
  sx?: BoxProps["sx"];
};

function ActionBar({ selectedCell, owner, sx }: ActionBarProps) {
  const { account } = useStarknet();
  const { contract } = useStarkSheetContract();
  const { data } = useStarknetCall({
    contract,
    method: "getCell",
    args: [selectedCell?.id],
  });

  const [unSavedValue, setUnsavedValue] = React.useState<string>(
    // @ts-ignore
    selectedCell ? data?.value?.toString() : ""
  );
  const previousSelectedCell = React.useRef<string | null>(
    selectedCell ? selectedCell.name : null
  );
  const inputRef = React.useRef<ContentEditable>(null);

  React.useEffect(() => {
    if (selectedCell === previousSelectedCell.current) return;

    if (
      inputRef.current &&
      inputRef.current.el &&
      inputRef.current.el.current
    ) {
      inputRef.current.el.current.focus();
    }

    previousSelectedCell.current = selectedCell ? selectedCell.name : null;
    // @ts-ignore
    if (selectedCell && data?.value) {
      // @ts-ignore
      setUnsavedValue(data?.value?.toString());
    } else {
      setUnsavedValue("");
    }
  }, [selectedCell, data]);

  return (
    <Box sx={{ display: "flex", ...sx }}>
      <Cell sx={{ width: "134px", "& .content": { textAlign: "center" } }}>
        {selectedCell?.name}
      </Cell>
      <Cell sx={{ flex: 1, marginLeft: `-${CELL_BORDER_WIDTH}px` }}>
        {selectedCell && (
          <Box sx={{ display: "flex", "& .cell": { color: "#FF4F0A" } }}>
            {!owner && (
              <Box sx={{ padding: "0 15px" }}>
                Once minted, owner can set a value directly or with a formula
              </Box>
            )}
            {!!owner && (
              <>
                <Box sx={{ padding: "0 15px" }}>=</Box>
                {(!account || account !== owner) && <Box>{unSavedValue}</Box>}
                {!!account && account === owner && (
                  <ContentEditable
                    style={{
                      width: "100%",
                      height: "100%",
                      outline: "none",
                      display: "flex",
                      alignItems: "center",
                    }}
                    // @ts-ignore
                    ref={inputRef}
                    onChange={() => {
                      setUnsavedValue(
                        inputRef?.current?.el.current.innerText
                          .trim()
                          .replaceAll("\n", "")
                          .replaceAll("\r", "")
                      );
                    }}
                    html={buildFormulaDisplay(selectedCell.name, unSavedValue)}
                  />
                )}
              </>
            )}
          </Box>
        )}
      </Cell>
      <SaveButton
        selectedCell={selectedCell}
        currentCellOwnerAddress={owner}
        sx={{ marginLeft: `-${CELL_BORDER_WIDTH}px` }}
      />
    </Box>
  );
}

export default ActionBar;
