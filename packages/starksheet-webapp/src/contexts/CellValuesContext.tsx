import BN from "bn.js";
import React, {
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { Contract, FunctionAbi } from "starknet";
import { toBN } from "starknet/utils/number";
import { isDependency } from "../components/ActionBar/formula.utils";
import { useSheetContract } from "../hooks/useSheetContract";
import {
  network,
  chainProvider,
} from "../provider";
import {
  Cell,
  CellData,
  CellGraph,
  CellRendered,
  CellValues,
  UpdatedValues,
} from "../types";
import { RC_BOUND } from "../utils/constants";
import { bn2hex } from "../utils/hexUtils";
import { resolveContractAddress } from "../utils/sheetUtils";
import { AbisContext } from "./AbisContext";
import { AppStatusContext } from "./AppStatusContext";
import { StarksheetContext } from "./StarksheetContext";

const defaultRenderedCell = (tokenId: number): CellRendered => ({
  id: toBN(tokenId),
  owner: toBN(0),
  value: toBN(0),
});

const defaultCellData = (tokenId: number): CellData => ({
  contractAddress: RC_BOUND,
  selector: toBN(0),
  calldata: [],
});

const GRID_SIZE = 15 * 15;

export const CellValuesContext = React.createContext<{
  values: CellValues;
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
  updatedValues: {},
  currentCells: [],
  currentUpdatedCells: {},
  setUpdatedValues: () => {},
  setCurrentUpdatedCells: () => {},
  computeValue: () => async () => toBN(0),
  updateCells: () => {},
  buildChildren: () => () => {},
  buildParents: () => () => {},
  selectedCell: 0,
  setSelectedCell: () => {},
});

export const CellValuesContextProvider = ({
  children,
}: PropsWithChildren<{}>) => {
  const { getAbiForContract } = useContext(AbisContext);
  const { selectedSheetAddress, starksheet, selectedSheet } =
    useContext(StarksheetContext);
  const { appStatus, updateSheetStatus } = useContext(AppStatusContext);

  const [values, setValues] = useState<CellValues>({});
  const [updatedValues, setUpdatedValues] = useState<UpdatedValues>({});
  const [selectedCell, setSelectedCell] = React.useState<number>(0);
  const previousGridData = useRef<any>(undefined);
  const previousSelectedSheet = useRef<any>(undefined);

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

  const { contract } = useSheetContract();

  const refreshMarketplaces = useCallback(
    (cells: Cell[]) => {
      if (
        previousGridData.current &&
        previousSelectedSheet.current === selectedSheetAddress
      ) {
        cells.forEach((cell, index) => {
          if (
            previousGridData.current[index]?.value?.toString() !==
            cell?.value?.toString()
          ) {
            fetch(
              network === "mainnet"
                ? `https://api.aspect.co/api/v0/asset/${selectedSheetAddress}/${index}/refresh`
                : `https://api-testnet.aspect.co/api/v0/asset/${selectedSheetAddress}/${index}/refresh`
            );
            fetch(
              network === "mainnet"
                ? `https://api.mintsquare.io/nft/metadata/starknet-mainnet/${selectedSheetAddress}/${index}/`
                : `https://api.mintsquare.io/nft/metadata/starknet-testnet/${selectedSheetAddress}/${index}/`,
              { method: "POST" }
            );
          }
        });
      }
      previousGridData.current = cells;
      previousSelectedSheet.current = selectedSheetAddress;
    },
    [selectedSheetAddress]
  );

  const load = useCallback(
    (contract: Contract) => {
      // Copy current sheet address to prevent storing the async call results into the wrong key

      if (selectedSheet === undefined) {
        return;
      }

      const _selectedSheetAddress = starksheet.sheets[selectedSheet].address;
      if (!_selectedSheetAddress) {
        return;
      }

      if (appStatus.sheets[_selectedSheetAddress].loading) return;

      updateSheetStatus(_selectedSheetAddress, { loading: true, error: false });
      if (
        _selectedSheetAddress in values &&
        values[_selectedSheetAddress].length !== 0
      ) {
        updateSheetStatus(_selectedSheetAddress, { loading: false });
        return;
      }

      let error = false;
      let finalMessage = "";

      const timedoutRenderCell = (tokenId: number) =>
        Promise.race([
          contract
            .call("renderCell", [tokenId], { blockIdentifier: "latest" })
            .then((result) => result.cell as CellRendered),
          new Promise((resolve, reject) =>
            setTimeout(
              () => reject(new Error(`timeoutRenderCell(${tokenId})`)),
              30_000
            )
          ),
        ]);

      const tokenIdsPromise = () =>
        contract
          .call("totalSupply", [], { blockIdentifier: "latest" })
          .then((response) => {
            return Promise.all(
              Array.from(Array(response.totalSupply.low.toNumber()).keys()).map(
                (i) =>
                  contract
                    .call("tokenByIndex", [[i, "0"]], {
                      blockIdentifier: "latest",
                    })
                    .then((result) => {
                      return result.tokenId.low.toNumber();
                    })
              )
            );
          });

      const renderCells = () =>
        tokenIdsPromise().then((tokenIds) => {
          return Promise.all(
            tokenIds.map((tokenId) =>
              timedoutRenderCell(tokenId).catch((error) => {
                return contract
                  .call("ownerOf", [[tokenId, "0"]], {
                    blockIdentifier: "latest",
                  })
                  .then((owner) => {
                    return {
                      ...defaultRenderedCell(tokenId),
                      owner: owner.owner,
                      error: true,
                    } as CellRendered;
                  });
              })
            )
          );
        });

      const fetchCells = renderCells().then((renderedCells) => {
        updateSheetStatus(_selectedSheetAddress, {
          message: "Fetching cells metadata",
        });
        return Promise.all(
          (renderedCells as CellRendered[]).map(async (cell) => {
            const _cell = await contract.call("getCell", [cell.id], {
              blockIdentifier: "latest",
            });
            return {
              ...cell,
              contractAddress: _cell.contractAddress,
              selector: _cell.value,
              calldata: _cell.cell_calldata,
              error: cell.error,
            };
          })
        );
      });
      const newGridCells = new Promise<Cell[]>((resolve, reject) =>
        resolve([])
      );

      updateSheetStatus(_selectedSheetAddress, {
        message: "Rendering grid values",
      });
      (!!starksheet.sheets[selectedSheet].calldata ? newGridCells : fetchCells)
        .then((cells: Cell[]) => {
          updateSheetStatus(_selectedSheetAddress, {
            message: "Finalizing sheet data",
          });
          const _cells = cells.reduce(
            (prev, cell) => ({
              ...prev,
              [parseInt(cell.id.toString())]: cell,
            }),
            {} as { [id: number]: Cell }
          );

          return Promise.all(
            Array.from(Array(GRID_SIZE).keys())
              .map(
                (i) =>
                  _cells[i] || {
                    ...defaultRenderedCell(i),
                    ...defaultCellData(i),
                  }
              )
              .map(async (cell, _, array) => {
                const resolvedContractAddress = cell.contractAddress.lt(
                  RC_BOUND
                )
                  ? array[cell.contractAddress.toNumber()].value
                  : cell.contractAddress;
                const abi = await getAbiForContract(
                  bn2hex(resolvedContractAddress)
                );
                return {
                  ...cell,
                  abi: abi[bn2hex(cell.selector)] as FunctionAbi,
                };
              })
          );
        })
        .then((cells) => {
          refreshMarketplaces(cells);
          setValues((prevValues) => ({
            ...prevValues,
            [_selectedSheetAddress]: cells,
          }));
        })
        .catch(() => {
          error = true;
          finalMessage = `Error: Starksheet cannot render the sheet atm!
              <br />
              <br />
              Team is working on it, we'll let you know on Twitter and Discord
              when it's back.`;
        })
        .finally(() => {
          updateSheetStatus(_selectedSheetAddress, {
            loading: false,
            error,
            message: finalMessage,
          });
        });
    },
    // eslint-disable-next-line
    [refreshMarketplaces, starksheet, selectedSheet]
  );

  React.useEffect(() => {
    if (contract) {
      load(contract);
    }
  }, [contract, load]);

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
          : arg.div(toBN(2));
      })
      .map((arg) => arg.toString());

    const call = {
      contractAddress,
      entrypoint: cell.abi.name,
      calldata,
    };

    const value =
      cell.abi.stateMutability === "view"
        ? (await chainProvider.callContract(call)).result[0]
        : NaN;
    return toBN(value);
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
        .map((cell) => cell.id.toNumber());

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
      const id = cell.id.toNumber();
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
