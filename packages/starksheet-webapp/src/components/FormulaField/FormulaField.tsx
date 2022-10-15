import { Box } from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import ContentEditable, {
  Props as ContentEditableProps,
} from "react-contenteditable";
import { CELL_BORDER_WIDTH, CELL_HEIGHT, CELL_WIDTH } from "../../config";
import { AbisContext } from "../../contexts/AbisContext";
import { CellValuesContext } from "../../contexts/CellValuesContext";
import { bn2hex } from "../../utils/hexUtils";
import {
  buildFormulaDisplay,
  cellNameRegex,
  cellNameToTokenId,
} from "../ActionBar/formula.utils";

export type FormulaFieldProps = {
  inputRef: React.RefObject<ContentEditable>;
  onChange: ContentEditableProps["onChange"];
  setValue: (value: string) => void;
  value: string;
};

function FormulaField({
  inputRef,
  onChange,
  value,
  setValue,
}: FormulaFieldProps) {
  const { contractAbis, getAbiForContract } = useContext(AbisContext);
  const { currentCells } = useContext(CellValuesContext);
  const [abi, setAbi] = useState<{ [name: string]: string }>({});
  const [selectedContractAddress, setSelectedContractAddress] = useState("");
  const contractAddresses = Object.keys(contractAbis).filter(
    (address) => Object.keys(contractAbis[address] || {}).length > 0
  );
  useEffect(() => {
    if (value.slice(-1) === ".") {
      let _selectedContractAddress = value.slice(0, -1);
      setSelectedContractAddress(_selectedContractAddress);
      if (_selectedContractAddress.match(cellNameRegex)) {
        _selectedContractAddress = bn2hex(
          currentCells[cellNameToTokenId(_selectedContractAddress)].value
        );
      }
      getAbiForContract(_selectedContractAddress).then((abi) => {
        const parsedAbi = !!abi
          ? Object.values(abi).reduce(
              (prev, cur) => ({
                ...prev,
                [cur.name]: cur.inputs
                  .map((i) => i.name)
                  .filter((n) => !n.endsWith("_len"))
                  .join("; "),
              }),
              {}
            )
          : {};
        setAbi(parsedAbi);
      });
    }
  }, [value, getAbiForContract, currentCells]);

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
        onChange={onChange}
        html={buildFormulaDisplay(value)}
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
          contractAddresses
            .filter((op) => op.startsWith(value) && !value.includes(op))
            .map((op) => (
              <Box
                key={op}
                onClick={() => {
                  setValue(`${op}.`);
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
        {!!abi &&
          Object.keys(abi)
            .filter(
              (op) =>
                op.startsWith(value.split(".")[1]) &&
                !value.split(".")[1].includes(op)
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
