import { Box } from "@mui/material";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import ContentEditable from "react-contenteditable";
import { FunctionAbi } from "starknet";
import { CELL_BORDER_WIDTH, CELL_HEIGHT, CELL_WIDTH } from "../../config";
import { AbisContext } from "../../contexts/AbisContext";
import { CellValuesContext } from "../../contexts/CellValuesContext";
import { bn2hex } from "../../utils/hexUtils";
import {
  ARGS_SEP,
  buildFormulaDisplay,
  cellNameRegex,
  cellNameToTokenId,
  CONTRACT_FUNCTION_SEP,
} from "../ActionBar/formula.utils";

export type FormulaFieldProps = {
  inputRef: React.RefObject<ContentEditable>;
  setValue: (value: string) => void;
  value: string;
  cellSettings?: { text: boolean };
  disabled: boolean;
};

function FormulaField({
  inputRef,
  value,
  setValue,
  cellSettings,
  disabled,
}: FormulaFieldProps) {
  const { contractAbis, getAbiForContract } = useContext(AbisContext);
  const { currentCells } = useContext(CellValuesContext);
  const [abi, setAbi] = useState<{ [name: string]: string }>({});
  const [selectedContractAddress, setSelectedContractAddress] = useState("");

  const contractAddresses = useMemo(
    () =>
      Object.keys(contractAbis)
        .filter(
          (address) => Object.keys(contractAbis[address] || {}).length > 0
        )
        .filter((op) => op.startsWith(value) && !value.includes(op)),
    [contractAbis, value]
  );

  const updateAbi = useCallback(
    (value: string) => {
      let _selectedContractAddress = value.split(CONTRACT_FUNCTION_SEP)[0];
      setSelectedContractAddress(_selectedContractAddress);
      if (_selectedContractAddress.match(cellNameRegex)) {
        _selectedContractAddress = bn2hex(
          currentCells[cellNameToTokenId(_selectedContractAddress)].value
        );
      }
      getAbiForContract(_selectedContractAddress).then((abi) => {
        const parsedAbi = Object.values(abi)
          .filter((_abi) => _abi.type === "function")
          .reduce(
            (prev, cur) => ({
              ...prev,
              [cur.name]: (cur as FunctionAbi).inputs
                .filter((i) => !i.name.endsWith("_len"))
                .map((i) => ({
                  ...i,
                  displayedType: `${i.name}:${i.type
                    .replace(/felt|Uint256/, "number")
                    .replace("*", "")}`,
                }))
                .map((i) =>
                  i.type.endsWith("*")
                    ? `[${i.displayedType}]`
                    : i.displayedType
                )
                .join(`${ARGS_SEP} `),
            }),
            {}
          );
        setAbi(parsedAbi);
      });
    },
    [getAbiForContract, currentCells]
  );

  useEffect(() => {
    if (value.slice(-1) === CONTRACT_FUNCTION_SEP) {
      updateAbi(value);
    }
  }, [value, updateAbi]);

  return (
    <>
      <ContentEditable
        style={{
          width: "100%",
          height: "100%",
          outline: "none",
          display: "flex",
          alignItems: "center",
          position: "relative",
          overflow: "auto",
        }}
        // @ts-ignore
        ref={inputRef}
        onChange={() =>
          setValue(
            inputRef?.current?.el.current.innerText
              .trim()
              .replaceAll("\n", "")
              .replaceAll("\r", "")
          )
        }
        html={buildFormulaDisplay(value, cellSettings)}
        disabled={disabled}
      />
      <Box
        sx={{
          position: "absolute",
          background: "white",
          zIndex: 1,
          top: `${CELL_HEIGHT * 2 - CELL_BORDER_WIDTH}px`,
          left: `${CELL_WIDTH * 2 - CELL_BORDER_WIDTH}px`,
          border: "1px solid black",
          maxHeight: "300px",
          overflow: "auto",
        }}
      >
        {value !== "0" &&
          contractAddresses.map((_address) => (
            <Box
              key={_address}
              onClick={() => {
                setValue(`${_address}${CONTRACT_FUNCTION_SEP}`);
                // @ts-ignore
                inputRef?.current?.el.current.focus();
              }}
              sx={{
                cursor: "pointer",
                border: "2px solid black",
                padding: "8px",
                "&:hover": { background: "#e2e2e2" },
              }}
            >
              {_address}
            </Box>
          ))}
        {!!abi &&
          Object.keys(abi)
            .filter(
              (op) =>
                op.startsWith(value.split(CONTRACT_FUNCTION_SEP)[1]) &&
                !value.split(CONTRACT_FUNCTION_SEP)[1].includes(op)
            )
            .map((op) => (
              <Box
                key={op}
                onClick={() => {
                  setValue(`${selectedContractAddress}.${op}(${abi[op]}`);
                  // @ts-ignore
                  inputRef?.current?.el.current.focus();
                }}
                sx={{
                  cursor: "pointer",
                  border: "2px solid black",
                  padding: "8px",
                  "&:hover": { background: "#e2e2e2" },
                }}
              >
                {op}
              </Box>
            ))}
      </Box>
    </>
  );
}

export default FormulaField;
