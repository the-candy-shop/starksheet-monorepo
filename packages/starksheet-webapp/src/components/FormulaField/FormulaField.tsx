import React from "react";
import ContentEditable, {
  Props as ContentEditableProps,
} from "react-contenteditable";
import { buildFormulaDisplay } from "../ActionBar/formula.utils";

export type FormulaFieldProps = {
  inputRef: React.Ref<ContentEditable>;
  onChange: ContentEditableProps["onChange"];
  value: string;
};

function FormulaField({ inputRef, onChange, value }: FormulaFieldProps) {
  return (
    <>
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
        onChange={onChange}
        html={buildFormulaDisplay(value)}
      />
    </>
  );
}

export default FormulaField;
