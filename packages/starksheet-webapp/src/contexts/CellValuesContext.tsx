import React, {
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useChainProvider } from "../hooks/useChainProvider";
import { Cell, CellData, CellGraph, CellValues, UpdatedValues } from "../types";
import { RC_BOUND } from "../utils/constants";
import { bigint2hex } from "../utils/hexUtils";
import { isDependency, resolveContractAddress } from "../utils/sheetUtils";
import { OnsheetContext } from "./OnsheetContext";

export const CellValuesContext = React.createContext<{
  values: CellValues;
  setValues: React.Dispatch<React.SetStateAction<CellValues>>;
  updatedValues: UpdatedValues;
  currentCells: Cell[];
  currentUpdatedCells: { [key: number]: Cell };
  setUpdatedValues: (values: UpdatedValues) => void;
  setCurrentUpdatedCells: (cells: { [key: number]: Cell }) => void;
  computeValue: (values: bigint[]) => (cell: CellData) => Promise<bigint>;
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
  computeValue: () => async () => 0n,
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

  const computeValue = (values: bigint[]) => async (cell: CellData) => {
    if (cell.contractAddress === RC_BOUND || !cell.abi) {
      return cell.selector;
    }

    const resolvedContractAddress = resolveContractAddress(
      values,
      cell.contractAddress
    );

    const contractAddress = bigint2hex(resolvedContractAddress);

    const calldata = cell.calldata.map((arg) => {
      return isDependency(arg) ? values[(Number(arg) - 1) / 2] : arg / 2n;
    });

    const call = {
      to: contractAddress,
      entrypoint: cell.abi.name,
      selector: cell.selector,
      calldata,
      abi: cell.abi,
    };

    const value =
      cell.abi.stateMutability === "view" || cell.abi.stateMutability === "pure"
        ? await chainProvider.callContract(call)
        : 0;

    return BigInt(value);
  };

  const buildChildren = useCallback(
    (children: CellGraph, depth?: number) => (id: number) => {
      if (!selectedSheetAddress) return;
      const currentChildren = values[selectedSheetAddress]
        .filter(
          (cell) =>
            cell.calldata
              .filter(isDependency)
              .map((arg) => (Number(arg) - 1) / 2)
              .includes(id) ||
            (cell.contractAddress < RC_BOUND &&
              Number(cell.contractAddress) === id)
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
        .map((arg) => (Number(arg) - 1) / 2);
      if (cell.contractAddress < RC_BOUND) {
        currentParents.push(Number(cell.contractAddress));
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
        cell.contractAddress !== currentCells[id].contractAddress ||
        cell.selector !== currentCells[id].selector ||
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
