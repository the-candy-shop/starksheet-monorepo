import BN from "bn.js";
import { Contract, number, ProviderInterface } from "starknet";
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

  async renderCells(): Promise<CellRendered[]> {
    const totalSupply = await this.totalSupply();
    const tokenIds = await Promise.all(
      Array.from(Array(totalSupply).keys()).map((i) => this.tokenByIndex(i))
    );
    return Promise.all(tokenIds.map((tokenId) => this.renderCell(tokenId)));
  }

  private async tokenByIndex(index: number): Promise<number> {
    const result = await this.contract.call("tokenByIndex", [[index, "0"]], {
      blockIdentifier: "latest",
    });
    return result.tokenId.low.toNumber();
  }

  async name(): Promise<string> {
    const result = await this.contract.call("name", [], {
      blockIdentifier: "latest",
    });
    return hex2str(normalizeHexString(result.name));
  }

  async symbol(): Promise<string> {
    const result = await this.contract.call("symbol", [], {
      blockIdentifier: "latest",
    });
    return hex2str(normalizeHexString(result.symbol));
  }
}
