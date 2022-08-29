import { Box, BoxProps } from "@mui/material";
import { useStarknet } from "@starknet-react/core";
import { useSnackbar } from "notistack";
import React, { useCallback, useContext, useEffect } from "react";
import ContentEditable from "react-contenteditable";
import { toBN } from "starknet/utils/number";
import { CELL_BORDER_WIDTH } from "../../config";
import { AbisContext } from "../../contexts/AbisContext";
import { CellValuesContext } from "../../contexts/CellValuesContext";
import { useStarkSheetContract } from "../../hooks/useStarkSheetContract";
import Cell from "../Cell/Cell";
import FormulaField from "../FormulaField/FormulaField";
import LoadingDots from "../LoadingDots/LoadingDots";
import SaveButton from "../SaveButton/SaveButton";
import {
  buildFormulaDisplay,
  CellData,
  getDependencies,
  parse,
  toPlainTextFormula,
} from "./formula.utils";

export type ActionBarProps = {
  selectedCell: { name: string; id: number } | null;
  owner: string | undefined;
  sx?: BoxProps["sx"];
};

function ActionBar({ selectedCell, owner, sx }: ActionBarProps) {
  const { cellNames } = useContext(CellValuesContext);
  const { getAbiForContract } = useContext(AbisContext);
  const { enqueueSnackbar } = useSnackbar();
  const { account } = useStarknet();
  const { contract } = useStarkSheetContract();
  const [loading, setLoading] = React.useState<boolean>(false);
  const [newDependencies, setNewDependencies] = React.useState<number[]>([]);
  const [disabled, setDisabled] = React.useState<boolean>(false);
  const [unSavedValue, setUnsavedValue] = React.useState<string>("");
  const [cellData, setCellData] = React.useState<CellData | null>(null);
  const previousSelectedCell = React.useRef<string | null>(
    selectedCell ? selectedCell.name : null
  );
  const inputRef = React.useRef<ContentEditable>(null);

  const getAllDependencies = useCallback(
    (_dependencies: number[]) =>
      async (tokenId: number): Promise<any> => {
        if (!contract) {
          return;
        }
        return contract
          .call("getCell", [tokenId])
          .then((cellData: any) => {
            const deps = getDependencies(cellData.cell_calldata);
            deps.forEach((d) => _dependencies.push(d));
            return deps;
          })
          .then((deps) =>
            Promise.all(deps.map((d) => getAllDependencies(_dependencies)(d)))
          );
      },
    [contract]
  );

  useEffect(() => {
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
        .then(async (cellData: any) => {
          const abi = await getAbiForContract(
            "0x" + cellData.contractAddress.toString(16)
          );
          return { ...cellData, abi };
        })
        .then((cellData) => {
          setUnsavedValue(
            toPlainTextFormula(
              {
                contractAddress: cellData.contractAddress,
                abi: cellData.abi,
                value: cellData.value,
                calldata: cellData.cell_calldata,
              },
              cellNames
            )
          );
        })
        .catch((error: any) =>
          enqueueSnackbar(error.toString(), { variant: "error" })
        )
        .finally(() => setLoading(false));
    }
  }, [cellNames, contract, enqueueSnackbar, selectedCell, getAbiForContract]);

  useEffect(() => {
    const _cellData = parse(unSavedValue);

    if (!_cellData) {
      setCellData(_cellData);
      return;
    }

    setDisabled(true);

    let _deps = getDependencies(_cellData.calldata);

    Promise.all(_deps.map((d) => getAllDependencies(_deps)(d)))
      .then(() => {
        setNewDependencies(Array.from(new Set(_deps)));
      })
      .catch((error: any) =>
        enqueueSnackbar(error.toString(), { variant: "error" })
      )
      .finally(() => setDisabled(false));

    getAbiForContract("0x" + _cellData.contractAddress.toString(16))
      .then((abi) => {
        return !!abi && Object.keys(abi).length > 0
          ? abi[_cellData.value.toString(16)].inputs
          : [];
      })
      .then((inputs) => {
        if (inputs.filter((i) => i.type === "felt*").length > 0) {
          // TODO: this is a very naive way to handle arrays because atm the FE does not let the user pass list and felts
          _cellData.calldata = [
            toBN(_cellData.calldata.length * 2),
            ..._cellData.calldata,
          ];
        }
        setCellData(_cellData);
      });
  }, [unSavedValue, enqueueSnackbar, getAllDependencies, getAbiForContract]);

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
          overflow: "auto",
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
                    sx={{
                      overflow: "auto",
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
        cellData={cellData}
        newDependencies={newDependencies}
        selectedCell={selectedCell}
        disabled={disabled}
        currentCellOwnerAddress={owner}
        sx={{ marginLeft: `-${CELL_BORDER_WIDTH}px` }}
      />
    </Box>
  );
}

export default ActionBar;
