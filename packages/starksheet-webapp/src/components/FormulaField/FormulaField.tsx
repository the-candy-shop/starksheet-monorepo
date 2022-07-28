import React from "react";
import ContentEditable, {
  Props as ContentEditableProps,
} from "react-contenteditable";
import { buildFormulaDisplay } from "../ActionBar/formula.utils";
import { Box } from "@mui/material";
import { CELL_HEIGHT } from "../../config";

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
  const operations = ["SUM", "MINUS", "DIVIDE", "PRODUCT"];
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
        }}
      >
        {operations
          .filter((op) => op.startsWith(value) && !value.includes(op))
          .map((op) => (
            <Box
              key={op}
              onClick={() => {
                setValue(`${op}(`);
                // @ts-ignore
                inputRef?.current?.el.current.focus();
              }}
              sx={{
                cursor: "pointer",
                border: "2px solid black",
                padding: "8px",
                width: "150px",
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
