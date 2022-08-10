import React, { useContext } from "react";
import { Box, BoxProps } from "@mui/material";
import Cell from "../Cell/Cell";
import { CELL_BORDER_WIDTH } from "../../config";
import ContentEditable from "react-contenteditable";
import { buildFormulaDisplay, toPlainTextFormula } from "./formula.utils";
import { useStarknet } from "@starknet-react/core";
import { useStarkSheetContract } from "../../hooks/useStarkSheetContract";
import SaveButton from "../SaveButton/SaveButton";
import { CellValuesContext } from "../../contexts/CellValuesContext";
import FormulaField from "../FormulaField/FormulaField";
import LoadingDots from "../LoadingDots/LoadingDots";
import { useSnackbar } from "notistack";

export type ActionBarProps = {
  selectedCell: { name: string; id: number } | null;
  owner: string | undefined;
  sx?: BoxProps["sx"];
};

function ActionBar({ selectedCell, owner, sx }: ActionBarProps) {
  const { cellNames } = useContext(CellValuesContext);
  const { enqueueSnackbar } = useSnackbar();
  const { account } = useStarknet();
  const { contract } = useStarkSheetContract();
  const [loading, setLoading] = React.useState<boolean>(false);
  const [unSavedValue, setUnsavedValue] = React.useState<string>("");
  const previousSelectedCell = React.useRef<string | null>(
    selectedCell ? selectedCell.name : null
  );
  const inputRef = React.useRef<ContentEditable>(null);

  React.useEffect(() => {
    if (
      contract &&
      selectedCell &&
      previousSelectedCell.current !== selectedCell.name
    ) {
      inputRef?.current?.el?.current?.focus();
      previousSelectedCell.current = selectedCell ? selectedCell.name : null;

      setLoading(true);
      contract
        .call("getCell", [selectedCell.id])
        .then((cellData: any) =>
          setUnsavedValue(
            toPlainTextFormula(
              { value: cellData.value, cell_calldata: cellData.cell_calldata },
              cellNames
            )
          )
        )
        .catch((error: any) =>
          enqueueSnackbar(error.toString(), { variant: "error" })
        )
        .finally(() => setLoading(false));
    }
  }, [cellNames, contract, enqueueSnackbar, selectedCell]);

  return (
    <Box sx={{ display: "flex", ...sx }}>
      <Cell sx={{ width: "134px", "& .content": { textAlign: "center" } }}>
        {selectedCell?.name}
      </Cell>
      <Cell
        sx={{
          flex: 1,
          marginLeft: `-${CELL_BORDER_WIDTH}px`,
          position: "relative",
        }}
      >
        {loading && <LoadingDots />}
        {!loading && selectedCell && (
          <Box
            sx={{
              display: "flex",
              "& .cell": { color: "#FF4F0A" },
              "& .operator": { color: "#0000FF" },
            }}
          >
            {!owner && (
              <Box sx={{ padding: "0 15px" }}>
                Once minted, owner can set a value directly or with a formula
              </Box>
            )}
            {!!owner && (
              <>
                <Box sx={{ padding: "0 15px" }}>=</Box>
                {(!account || account !== owner) && (
                  <Box
                    dangerouslySetInnerHTML={{
                      __html: buildFormulaDisplay(unSavedValue),
                    }}
                  />
                )}
                {!!account && account === owner && (
                  <FormulaField
                    inputRef={inputRef}
                    setValue={setUnsavedValue}
                    onChange={() => {
                      setUnsavedValue(
                        inputRef?.current?.el.current.innerText
                          .trim()
                          .replaceAll("\n", "")
                          .replaceAll("\r", "")
                      );
                    }}
                    value={unSavedValue}
                  />
                )}
              </>
            )}
          </Box>
        )}
      </Cell>
      <SaveButton
        unSavedValue={unSavedValue}
        selectedCell={selectedCell}
        currentCellOwnerAddress={owner}
        sx={{ marginLeft: `-${CELL_BORDER_WIDTH}px` }}
      />
    </Box>
  );
}

export default ActionBar;
