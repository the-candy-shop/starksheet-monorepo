import BN from "bn.js";
import React, {
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { number } from "starknet";
import { isDependency } from "../components/ActionBar/formula.utils";
import { Cell, CellData, CellGraph, CellValues, UpdatedValues } from "../types";
import { RC_BOUND } from "../utils/constants";
import { bn2hex } from "../utils/hexUtils";
import { resolveContractAddress } from "../utils/sheetUtils";
import { OnsheetContext } from "./OnsheetContext";
import {useChainProvider} from '../hooks/useChainProvider';

export const CellValuesContext = React.createContext<{
  values: CellValues;
  setValues: React.Dispatch<React.SetStateAction<CellValues>>;
  updatedValues: UpdatedValues;
  currentCells: Cell[];
  currentUpdatedCells: { [key: number]: Cell };
  setUpdatedValues: (values: UpdatedValues) => void;
  setCurrentUpdatedCells: (cells: { [key: number]: Cell }) => void;
  computeValue: (values: BN[]) => (cell: CellData) => Promise<BN>;
  updateCells: (cells: Cell[]) => void;
  buildChildren: (children: CellGraph, depth?: number) => (id: number) => void;
  buildParents: (children: CellGraph, depth?: number) => (id: number) => void;
  selectedCell: number;
  setSelectedCell: (i: number) => void;
}>({
  values: {},
  setValues: () => {},
  updatedValues: {},
  currentCells: [],
  currentUpdatedCells: {},
  setUpdatedValues: () => {},
  setCurrentUpdatedCells: () => {},
  computeValue: () => async () => number.toBN(0),
  updateCells: () => {},
  buildChildren: () => () => {},
  buildParents: () => () => {},
  selectedCell: 0,
  setSelectedCell: () => {},
});

export const CellValuesContextProvider = ({
  children,
}: PropsWithChildren<{}>) => {
  const { selectedSheetAddress } = useContext(OnsheetContext);
  const chainProvider = useChainProvider();

  const [values, setValues] = useState<CellValues>({});
  const [updatedValues, setUpdatedValues] = useState<UpdatedValues>({});
  const [selectedCell, setSelectedCell] = React.useState<number>(0);

  const currentCells = useMemo(
    () => (selectedSheetAddress ? values[selectedSheetAddress] || [] : []),
    [selectedSheetAddress, values]
  );

  const currentUpdatedCells = useMemo(
    () =>
      selectedSheetAddress ? updatedValues[selectedSheetAddress] || {} : {},
    [selectedSheetAddress, updatedValues]
  );

  const setCurrentUpdatedCells = useCallback(
    (cells: { [key: number]: Cell }) => {
      if (!selectedSheetAddress) return;
      setUpdatedValues((prevUpdatedValues) => ({
        ...prevUpdatedValues,
        [selectedSheetAddress]: cells,
      }));
    },
    [selectedSheetAddress, setUpdatedValues]
  );

  const computeValue = (values: BN[]) => async (cell: CellData) => {
    if (cell.contractAddress.eq(RC_BOUND) || !cell.abi) {
      return cell.selector;
    }

    const resolvedContractAddress = resolveContractAddress(
      values,
      cell.contractAddress
    );

    const contractAddress = bn2hex(resolvedContractAddress);

    const calldata = cell.calldata
      .map((arg) => {
        return isDependency(arg)
          ? values[(arg.toNumber() - 1) / 2]
          : arg.div(number.toBN(2));
      })
      .map((arg) => arg.toString());

    const call = {
      contractAddress,
      entrypoint: cell.abi.name,
      calldata,
    };

    const value =
      cell.abi.stateMutability === "view"
        ? (await chainProvider.callContract<string>(call))
        : NaN;

    return number.toBN(value);
  };

  const buildChildren = useCallback(
    (children: CellGraph, depth?: number) => (id: number) => {
      if (!selectedSheetAddress) return;
      const currentChildren = values[selectedSheetAddress]
        .filter(
          (cell) =>
            cell.calldata
              .filter(isDependency)
              .map((arg) => (arg.toNumber() - 1) / 2)
              .includes(id) ||
            (cell.contractAddress.lt(RC_BOUND) &&
              cell.contractAddress.toNumber() === id)
        )
        .map((cell) => cell.id);

      currentChildren.forEach((_id) => {
        children[_id] = depth || 1;
      });

      currentChildren.map(buildChildren(children, (depth || 1) + 1));
    },
    [values, selectedSheetAddress]
  );

  const buildParents = useCallback(
    (parents: CellGraph, depth?: number) => (id: number) => {
      if (!selectedSheetAddress) return;
      const cell = values[selectedSheetAddress][id];
      const currentParents = cell.calldata
        .filter(isDependency)
        .map((arg) => (arg.toNumber() - 1) / 2);
      if (cell.contractAddress.lt(RC_BOUND)) {
        currentParents.push(cell.contractAddress.toNumber());
      }

      currentParents.forEach((_id) => {
        parents[_id] = depth || 1;
      });

      currentParents.map(buildParents(parents, (depth || 1) + 1));
    },
    [values, selectedSheetAddress]
  );

  const updateCells = (cells: Cell[]) => {
    if (!selectedSheetAddress) return;
    const newCells = [...currentCells];
    const newUpdatedCells = { ...currentUpdatedCells };
    for (const cell of cells) {
      const id = cell.id;
      newCells[id] = {
        ...newCells[id],
        ...cell,
      };
      if (
        !cell.contractAddress.eq(currentCells[id].contractAddress) ||
        !cell.selector.eq(currentCells[id].selector) ||
        cell.calldata !== currentCells[id].calldata
      ) {
        newUpdatedCells[id] = newCells[id];
      }
    }
    setUpdatedValues((prevUpdatedValues) => ({
      ...prevUpdatedValues,
      [selectedSheetAddress]: newUpdatedCells,
    }));
    setValues((prevValues) => ({
      ...prevValues,
      [selectedSheetAddress]: newCells,
    }));
  };

  return (
    <CellValuesContext.Provider
      value={{
        values,
        setValues,
        updatedValues,
        currentCells,
        currentUpdatedCells,
        setUpdatedValues,
        setCurrentUpdatedCells,
        computeValue,
        updateCells,
        buildChildren,
        buildParents,
        selectedCell,
        setSelectedCell,
      }}
    >
      {children}
    </CellValuesContext.Provider>
  );
};
