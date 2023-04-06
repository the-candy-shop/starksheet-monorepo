import { useContext, useMemo } from "react";
import { number } from "starknet";
import { OnsheetContext } from "../contexts/OnsheetContext";
import { CellData, CellRendered, SheetContract } from "../types";

import BN from "bn.js";
import { Abi, Contract } from "starknet";
import onsheetContractData from "../contract.json";
import { starknetRpcProvider } from "../provider";

class StarknetSheetContract implements SheetContract {
  private contract: Contract;

  constructor(address: string) {
    this.contract = new Contract(
      onsheetContractData.sheetAbi as Abi,
      address,
      starknetRpcProvider
    );
  }

  async renderCell(tokenId: number): Promise<CellRendered> {
    try {
      const result = await this.contract.call("renderCell", [tokenId], {
        blockIdentifier: "latest",
      });
      return result.cell as CellRendered;
    } catch (error) {
      const owner = await this.ownerOf(tokenId);
      return {
        id: tokenId,
        value: number.toBN(0),
        owner: owner,
        error: true,
      } as CellRendered;
    }
  }

  async totalSupply(): Promise<number> {
    const result = await this.contract.call("totalSupply", [], {
      blockIdentifier: "latest",
    });
    return result.totalSupply.low.toNumber();
  }

  async ownerOf(tokenId: number): Promise<BN> {
    const result = await this.contract.call("ownerOf", [[tokenId, "0"]]);
    return result.owner;
  }

  async getCell(tokenId: number.BigNumberish): Promise<CellData> {
    const _cell = await this.contract.call("getCell", [tokenId], {
      blockIdentifier: "latest",
    });
    return {
      contractAddress: _cell.contractAddress,
      selector: _cell.value,
      calldata: _cell.cell_calldata,
    };
  }

  async tokenByIndex(index: number): Promise<number> {
    const result = await this.contract.call("tokenByIndex", [[index, "0"]], {
      blockIdentifier: "latest",
    });
    return result.tokenId.low.toNumber();
  }

  async renderCells(): Promise<CellRendered[]> {
    const totalSupply = await this.totalSupply();
    const tokenIds = await Promise.all(
      Array.from(Array(totalSupply).keys()).map((i) => this.tokenByIndex(i))
    );
    return Promise.all(tokenIds.map((tokenId) => this.renderCell(tokenId)));
  }
}

export function useSheetContract() {
  const { selectedSheetAddress } = useContext(OnsheetContext);

  const contract = useMemo(
    () =>
      selectedSheetAddress
        ? new StarknetSheetContract(selectedSheetAddress)
        : undefined,
    [selectedSheetAddress]
  );

  return { contract };
}
