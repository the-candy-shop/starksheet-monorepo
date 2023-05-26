import { useContext, useMemo } from "react";
import { RpcProvider, number } from "starknet";
import { OnsheetContext } from "../contexts/OnsheetContext";
import { CellData, CellRendered, SheetContract } from "../types";

import BN from "bn.js";
import { Abi, Contract } from "starknet";
import { N_ROW } from "../config";
import onsheetContractData from "../contract.json";
import { rpcUrl } from "../provider";

class StarknetSheetContract implements SheetContract {
  private contract: Contract;

  constructor(address: string) {
    this.contract = new Contract(
      onsheetContractData.sheetAbi as Abi,
      address,
      new RpcProvider({
        nodeUrl: rpcUrl,
      })
    );
  }

  async nRow() {
    try {
      return parseInt(
        (
          await this.contract.providerOrAccount.callContract({
            contractAddress: this.contract.address,
            entrypoint: "getNRow",
          })
        ).result[0]
      );
    } catch (e) {
      return N_ROW;
    }
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

export function useSheetContract(address?: string) {
  const { selectedSheetAddress } = useContext(OnsheetContext);
  const sheetAddress = address || selectedSheetAddress;
  const contract = useMemo(
    () => (sheetAddress ? new StarknetSheetContract(sheetAddress) : undefined),
    [sheetAddress]
  );

  return { contract };
}
