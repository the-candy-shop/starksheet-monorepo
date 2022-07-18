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
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const id = open ? "simple-popper" : undefined;

  const handleFocus = (event: React.FocusEvent<HTMLElement>) => {
    console.log("event.currentTarget", event.currentTarget);
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  console.log("open", open);
  console.log("id", id);

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
        onFocus={handleFocus}
      />
    </>
  );
}

export default FormulaField;
