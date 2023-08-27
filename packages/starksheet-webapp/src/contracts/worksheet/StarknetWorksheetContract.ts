import { BigNumberish, CallData, Contract, ProviderInterface } from "starknet";
import { N_ROW } from "../../config";
import { Abi, CellData, CellRendered, WorksheetContract } from "../../types";
import { hex2str, normalizeHexString } from "../../utils/hexUtils";

export class StarknetWorksheetContract implements WorksheetContract {
  private contract: Contract;

  constructor(address: string, abi: Abi, provider: ProviderInterface) {
    this.contract = new Contract(abi, address, provider);
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

  async getCellPrice() {
    try {
      return parseInt(
        (
          await this.contract.providerOrAccount.callContract({
            contractAddress: this.contract.address,
            entrypoint: "getCellPrice",
          })
        ).result[0]
      );
    } catch (e) {
      return 0;
    }
  }

  async renderCell(tokenId: number): Promise<CellRendered> {
    try {
      const result = await this.contract.call("renderCell", [tokenId], {
        blockIdentifier: "latest",
      });
      // @ts-ignore
      return { ...result.cell, id: tokenId } as CellRendered;
    } catch (error) {
      const owner = await this.ownerOf(tokenId);
      return {
        id: tokenId,
        value: 0n,
        owner: owner,
        error: true,
      } as CellRendered;
    }
  }

  async totalSupply(): Promise<number> {
    const result = await this.contract.call("totalSupply", [], {
      blockIdentifier: "latest",
    });
    // @ts-ignore
    return Number(result.totalSupply.low);
  }

  async ownerOf(tokenId: number): Promise<bigint> {
    const result = await this.contract.call("ownerOf", [[tokenId, "0"]]);
    // @ts-ignore
    return result.owner;
  }

  async getCell(tokenId: BigNumberish): Promise<CellData> {
    const result = await this.contract.call("getCell", [tokenId], {
      blockIdentifier: "latest",
    });
    return {
      // @ts-ignore
      contractAddress: result.contractAddress,
      // @ts-ignore
      selector: result.value,
      // @ts-ignore
      calldata: result.cell_calldata,
    };
  }

  async renderCells(): Promise<CellRendered[]> {
    const totalSupply = await this.totalSupply();
    const tokenIds = await Promise.all(
      Array.from(Array(totalSupply).keys()).map((i) => this.tokenByIndex(i))
    );
    return Promise.all(tokenIds.map((tokenId) => this.renderCell(tokenId)));
  }

  private async tokenByIndex(index: number): Promise<number> {
    const result = await this.contract.call(
      "tokenByIndex",
      CallData.compile({
        index: {
          low: index,
          high: 0,
        },
      })
    );
    // @ts-ignore
    return Number(result.tokenId.low);
  }

  async name(): Promise<string> {
    const result = await this.contract.call("name", []);
    // @ts-ignore
    return hex2str(normalizeHexString(result.name));
  }

  async symbol(): Promise<string> {
    const result = await this.contract.call("symbol", []);
    // @ts-ignore
    return hex2str(normalizeHexString(result.symbol));
  }
}
