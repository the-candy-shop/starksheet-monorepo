import { Box } from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import ContentEditable, {
  Props as ContentEditableProps,
} from "react-contenteditable";
import { CELL_HEIGHT } from "../../config";
import { AbisContext } from "../../contexts/AbisContext";
import { buildFormulaDisplay, RC_BOUND } from "../ActionBar/formula.utils";

export type FormulaFieldProps = {
  inputRef: React.Ref<ContentEditable>;
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
  const [abi, setAbi] = useState<string[]>([]);
  const [selectedContractAddress, setSelectedContractAddress] = useState("");
  const contractAddresses = Object.keys(contractAbis).filter(
    (address) => address !== "0x" + RC_BOUND.toString(16)
  );
  useEffect(() => {
    if (value.slice(-1) === ".") {
      let _selectedContractAddress = value.slice(0, -1);
      setSelectedContractAddress(_selectedContractAddress);
      getAbiForContract(_selectedContractAddress).then((abi) =>
        setAbi(
          !!abi
            ? Object.values(abi)
                .filter((func) => func.type === "function")
                .filter((func) => func.stateMutability === "view")
                .map((func) => func.name)
            : []
        )
      );
    }
  }, [value, getAbiForContract]);

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
          top: `${CELL_HEIGHT}px`,
          left: "54px",
          border: "1px solid black",
          maxHeight: "300px",
          overflow: "auto",
        }}
      >
        {contractAddresses
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
          abi
            .filter(
              (op) =>
                op.startsWith(value.split(".")[1]) &&
                !value.split(".")[1].includes(op)
            )
            .map((op) => (
              <Box
                key={op}
                onClick={() => {
                  setValue(`${selectedContractAddress}.${op}(`);
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
