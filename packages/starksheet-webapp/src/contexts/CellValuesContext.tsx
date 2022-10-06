import BN from "bn.js";
import React, {
  PropsWithChildren,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { Contract } from "starknet";
import { toBN } from "starknet/utils/number";
import { isDependency, RC_BOUND } from "../components/ActionBar/formula.utils";
import { useSheetContract } from "../hooks/useSheetContract";
import { starknetRpcProvider, starknetSequencerProvider } from "../provider";
import {
  Cell,
  CellChildren,
  CellData,
  CellRendered,
  UpdatedValues,
} from "../types";
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
const network = process.env.REACT_APP_NETWORK;

export const CellValuesContext = React.createContext<{
  values: Cell[];
  updatedValues: UpdatedValues;
  setUpdatedValues: (values: UpdatedValues) => void;
  computeValue: (values: BN[]) => (cell: CellData) => Promise<BN>;
  updateCells: (cells: Cell[]) => void;
  buildChildren: (
    children: CellChildren,
    depth?: number
  ) => (id: number) => void;
  cellNames: string[];
  setCellNames: (value: string[]) => void;
}>({
  values: [],
  updatedValues: {},
  setUpdatedValues: () => {},
  computeValue: () => async () => toBN(0),
  updateCells: () => {},
  buildChildren: () => () => {},
  cellNames: [],
  setCellNames: () => {},
});

export const CellValuesContextProvider = ({
  children,
}: PropsWithChildren<{}>) => {
  const [values, setValues] = useState<Cell[]>([]);
  const [updatedValues, setUpdatedValues] = useState<UpdatedValues>({});
  const previousGridData = useRef<any>(undefined);
  const previousSelectedSheet = useRef<any>(undefined);
  const [cellNames, setCellNames] = useState<string[]>([]);

  const { getAbiForContract } = useContext(AbisContext);
  const { selectedSheet } = useContext(StarksheetContext);
  const { updateAppStatus } = useContext(AppStatusContext);

  const { contract } = useSheetContract();

  const refreshMarketplaces = useCallback(
    (cells: Cell[]) => {
      if (
        previousGridData.current &&
        previousSelectedSheet.current === selectedSheet
      ) {
        cells.forEach((cell, index) => {
          if (
            previousGridData.current[index]?.value?.toString() !==
            cell?.value?.toString()
          ) {
            fetch(
              network === "alpha-mainnet"
                ? `https://api.aspect.co/api/v0/asset/${contract?.address}/${index}/refresh`
                : `https://api-testnet.aspect.co/api/v0/asset/${contract?.address}/${index}/refresh`
            );
            fetch(
              network === "alpha-mainnet"
                ? `https://api.mintsquare.io/nft/metadata/starknet-mainnet/${contract?.address}/${index}/`
                : `https://api.mintsquare.io/nft/metadata/starknet-testnet/${contract?.address}/${index}/`,
              { method: "POST" }
            );
          }
        });
      }
      previousGridData.current = cells;
      previousSelectedSheet.current = selectedSheet;
    },
    [contract?.address, selectedSheet]
  );

  const load = useCallback(
    (contract: Contract) => {
      updateAppStatus({ loading: true, error: false });
      contract.connect(starknetRpcProvider);
      let error = false;
      let finalMessage = "";

      const timedoutRenderGrid = () =>
        Promise.race([
          contract
            .call("renderGrid", [])
            .then((result) => result.cells as CellRendered[]),
          new Promise((resolve, reject) =>
            setTimeout(() => reject(new Error("timeoutRenderGrid")), 80000)
          ),
        ]);

      const timedoutRenderCell = (tokenId: number) =>
        Promise.race([
          contract
            .call("renderCell", [tokenId])
            .then((result) => result.cell as CellRendered),
          new Promise((resolve, reject) =>
            setTimeout(
              () => reject(new Error(`timeoutRenderCell(${tokenId})`)),
              20000
            )
          ),
        ]);

      const tokenIdsPromise = () =>
        contract.call("totalSupply", []).then((response) => {
          return Promise.all(
            Array.from(Array(response.totalSupply.low.toNumber()).keys()).map(
              (i) =>
                contract.call("tokenByIndex", [[i, "0"]]).then((result) => {
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
                  .call("ownerOf", [[tokenId, "0"]])
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

      updateAppStatus({ message: "Calling renderGrid" });
      return timedoutRenderGrid()
        .catch(() => {
          updateAppStatus({
            message:
              "Contract failed to render grid, falling back to render each cell individually",
          });
          return renderCells();
        })
        .then((renderedCells) => {
          updateAppStatus({
            message: "Fetching cells metadata",
          });
          return Promise.all(
            (renderedCells as CellRendered[]).map(async (cell) => {
              const _cell = await contract.call("getCell", [cell.id]);
              return {
                ...cell,
                contractAddress: _cell.contractAddress,
                selector: _cell.value,
                calldata: _cell.cell_calldata,
                error: cell.error,
              };
            })
          );
        })
        .then((cells: Cell[]) => {
          updateAppStatus({
            message: "Finalizing sheet data",
          });
          const _cells = cells.reduce(
            (prev, cell) => ({
              ...prev,
              [parseInt(cell.id.toString())]: cell,
            }),
            {} as { [id: number]: Cell }
          );

          const gridCells = Array.from(Array(GRID_SIZE).keys()).map(
            (i) =>
              _cells[i] || { ...defaultRenderedCell(i), ...defaultCellData(i) }
          );
          refreshMarketplaces(gridCells);
          setValues(gridCells);
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
          updateAppStatus({
            loading: false,
            error,
            message: finalMessage,
          });
        });
    },
    // eslint-disable-next-line
    [refreshMarketplaces]
  );

  React.useEffect(() => {
    if (contract) {
      load(contract);
    }
  }, [contract, load]);

  const computeValue = (values: BN[]) => async (cell: CellData) => {
    if (cell.contractAddress.eq(RC_BOUND)) {
      return cell.selector;
    }

    const resolvedContractAddress = cell.contractAddress.lt(RC_BOUND)
      ? values[cell.contractAddress.toNumber()]
      : cell.contractAddress;

    const calldata = cell.calldata
      .map((arg) => {
        return isDependency(arg)
          ? values[(arg.toNumber() - 1) / 2]
          : arg.div(toBN(2));
      })
      .map((arg) => arg.toString());
    const contractAddress = "0x" + resolvedContractAddress.toString(16);
    const abi = await getAbiForContract(contractAddress);
    const call = {
      contractAddress,
      entrypoint: abi["0x" + cell.selector.toString(16)].name,
      calldata,
    };
    const value = await starknetSequencerProvider.callContract(call);
    return toBN(value.result[0]);
  };

  const buildChildren = useCallback(
    (children: CellChildren, depth?: number) => (id: number) => {
      const currentChildren = values
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
    [values]
  );

  const updateCells = (cells: Cell[]) => {
    const newValues = [...values];
    const newUpdatedValues = { ...updatedValues };
    for (const cell of cells) {
      const id = cell.id.toNumber();
      newValues[id] = {
        ...newValues[id],
        ...cell,
      };
      newUpdatedValues[id] = newValues[id];
    }
    setUpdatedValues(newUpdatedValues);
    setValues(newValues);
  };

  return (
    <CellValuesContext.Provider
      value={{
        cellNames,
        setCellNames,
        values,
        updatedValues,
        setUpdatedValues,
        computeValue,
        updateCells,
        buildChildren,
      }}
    >
      {children}
    </CellValuesContext.Provider>
  );
};
