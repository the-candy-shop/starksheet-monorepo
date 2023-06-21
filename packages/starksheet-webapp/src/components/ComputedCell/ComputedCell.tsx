import { useSnackbar } from "notistack";
import { useContext, useMemo } from "react";
import { constants, number } from "starknet";
import Tooltip from "../../Tooltip/Tooltip";
import { CELL_BORDER_WIDTH, CELL_WIDTH } from "../../config";
import { AccountContext } from "../../contexts/AccountContext";
import { CellValuesContext } from "../../contexts/CellValuesContext";
import { OnsheetContext } from "../../contexts/OnsheetContext";
import { TransactionsContext } from "../../contexts/TransactionsContext";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { chainConfig } from "../../provider/chains";
import { CellGraph, Cell as CellType } from "../../types";
import { RC_BOUND } from "../../utils/constants";
import { bn2hex, hex2str } from "../../utils/hexUtils";
import Cell from "../Cell/Cell";

const BLUE = "#0000FF";
const GREY = "#DEE5F0";
const RED = "#FF4F0A";
const BLACK = "black";
const WHITE = "white";
const GREEN = "#00FF00";

export type ComputedCellProps = {
  cell: CellType;
};

function ComputedCell({ cell }: ComputedCellProps) {
  const { accountAddress } = useContext(AccountContext);
  const { currentCells, selectedCell, setSelectedCell, buildParents } =
    useContext(CellValuesContext);
  const { selectedSheetAddress } = useContext(OnsheetContext);
  const { settleTransactions } = useContext(TransactionsContext);
  const { enqueueSnackbar } = useSnackbar();

  const id = useMemo(() => cell.id, [cell]);
  const [cellSettings, setCellSettings] = useLocalStorage(
    `${selectedSheetAddress}.${id}`,
    {}
  );
  const selected = useMemo(() => id === selectedCell, [selectedCell, id]);
  const isInvoke = useMemo(() => {
    if (!!cell.abi && cell.abi.stateMutability === undefined) {
      return true;
    }
    const parents: CellGraph = {};
    buildParents(parents)(id);
    return Object.keys(parents)
      .map((cellId) => currentCells[parseInt(cellId)])
      .some((_cell) => !!_cell.abi && _cell.abi.stateMutability === undefined);
  }, [cell, currentCells, id, buildParents]);

  const { background, borderColor, color } = useMemo(() => {
    const background =
      cell.owner.eq(number.toBN(0)) &&
      cell.contractAddress.eq(RC_BOUND) &&
      cell.selector.eq(number.toBN(0))
        ? WHITE
        : isInvoke
        ? GREEN
        : accountAddress === bn2hex(cell.owner) ||
          (cell.owner.eq(number.toBN(0)) &&
            !(
              cell.contractAddress.eq(RC_BOUND) &&
              cell.selector.eq(number.toBN(0))
            ))
        ? BLUE
        : GREY;

    const borderColor =
      background === BLUE || background === GREEN ? RED : BLUE;
    const color = background === BLUE ? WHITE : BLACK;
    return { background, borderColor, color };
  }, [cell, accountAddress, isInvoke]);

  const value = useMemo(() => {
    if (background === GREEN) return cell.abi?.name;
    if (background === WHITE) return "";
    if (cell.error) return "ERROR";

    const value = cell.value;
    const renderString =
      cell.abi?.name === "name" ||
      cell.abi?.name === "symbol" ||
      cellSettings.text;
    if (renderString) return hex2str(bn2hex(value));
    if (cell.contractAddress.eq(number.toBN(chainConfig.addresses.math))) {
      return value
        .add(
          number
            .toBN("0x" + constants.FIELD_PRIME)
            .div(number.toBN(2))
            .abs()
        )
        .mod(number.toBN("0x" + constants.FIELD_PRIME))
        .sub(
          number
            .toBN("0x" + constants.FIELD_PRIME)
            .div(number.toBN(2))
            .abs()
        )
        .toString();
    }
    if (value.gte(RC_BOUND)) return bn2hex(value);
    return value.toString();
  }, [cell, background, cellSettings.text]);

  const onClick = async (e: React.MouseEvent<HTMLElement>) => {
    setSelectedCell(id);
    if (e.detail === 2 && !isInvoke) {
      setCellSettings({ text: !cellSettings.text });
      return;
    }
    if (e.detail === 2 && isInvoke) {
      if (selectedSheetAddress === undefined) {
        return;
      }
      if (!accountAddress) {
        enqueueSnackbar(`Connect your wallet to make a transaction`, {
          variant: "error",
        });
        return;
      }
      settleTransactions([
        {
          contractAddress: selectedSheetAddress,
          entrypoint: "renderCell",
          calldata: [id],
        },
      ]);
    }
  };

  return (
    <Tooltip title={value && value.length > 4 ? value : false} followCursor>
      <span>
        <Cell
          key={id}
          selected={selected}
          onClick={onClick}
          sx={{
            width: `${CELL_WIDTH}px`,
            minWidth: `${CELL_WIDTH}px`,
            maxWidth: `${CELL_WIDTH}px`,
            marginLeft: `-${CELL_BORDER_WIDTH}px`,
            textAlign: "center",
            cursor: isInvoke ? "pointer" : undefined,
            background,
            color,

            "& .selection": {
              borderColor,
            },

            "& .selection-square": {
              background: borderColor,
            },
          }}
        >
          {value}
        </Cell>
      </span>
    </Tooltip>
  );
}

export default ComputedCell;
