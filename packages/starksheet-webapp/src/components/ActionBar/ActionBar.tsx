import React from "react";
import { Box, BoxProps } from "@mui/material";
import Cell from "../Cell/Cell";
import { CELL_BORDER_WIDTH } from "../../config";
import Button from "../Button/Button";
import ContentEditable from "react-contenteditable";
import { CellValuesContext } from "../../contexts/CellValuesContext";

export type ActionBarProps = {
  selectedCell: string | null;
  sx?: BoxProps["sx"];
};

function ActionBar({ selectedCell, sx }: ActionBarProps) {
  const { values, setValue } = React.useContext(CellValuesContext);
  const [unSavedValue, setUnsavedValue] = React.useState<string>(
    selectedCell ? values[selectedCell] : ""
  );
  const previousSelectedCell = React.useRef<string | null>(selectedCell);
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

    previousSelectedCell.current = selectedCell;
    if (selectedCell && values[selectedCell]) {
      setUnsavedValue(values[selectedCell]);
    } else {
      setUnsavedValue("");
    }
  }, [selectedCell, values]);

  const saveValue = React.useCallback(() => {
    if (!selectedCell) return;

    setValue(selectedCell, unSavedValue);
  }, [selectedCell, setValue, unSavedValue]);

  return (
    <Box sx={{ display: "flex", ...sx }}>
      <Cell sx={{ width: "134px", "& .content": { justifyContent: "center" } }}>
        {selectedCell}
      </Cell>
      <Cell sx={{ flex: 1, marginLeft: `-${CELL_BORDER_WIDTH}px` }}>
        {selectedCell && (
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
            onChange={(e) => setUnsavedValue(e.target.value)}
            html={unSavedValue}
          />
        )}
      </Cell>
      <Button
        sx={{
          marginLeft: `-${CELL_BORDER_WIDTH}px`,
          width: "221px",

          "& .content": {
            backgroundColor: "#FF4F0A",
            boxShadow: "inset -5px -5px 3px #FF8555, inset 5px 5px 3px #D9450B",
            justifyContent: "center",
          },
        }}
        onClick={saveValue}
      >
        Save Value
      </Button>
    </Box>
  );
}

export default ActionBar;
