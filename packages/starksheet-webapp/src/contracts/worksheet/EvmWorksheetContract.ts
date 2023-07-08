import { JsonRpcProvider } from "@ethersproject/providers";
import BN from "bn.js";
import "ethers";
import { number } from "starknet";
import { N_ROW } from "../../config";
import { CellData, CellRendered, WorksheetContract } from "../../types";
import {
  ethersHexStringToBN,
  hexStringToIntegerArray,
} from "../../utils/hexUtils";
import { Sheet, Sheet__factory } from "../types";

export class EvmWorksheetContract implements WorksheetContract {
  private contract: Sheet;

  /**
   * The class constructor.
   */
  constructor(address: string, provider: JsonRpcProvider) {
    this.contract = Sheet__factory.connect(address, provider);
  }

  /**
   * @inheritDoc
   */
  async getCell(tokenId: number): Promise<CellData> {
    const [contractAddress, selector, data] = await this.contract.getCell(
      tokenId
    );
    console.log("tokenId", [tokenId, contractAddress, selector, data]);
    return {
      contractAddress: ethersHexStringToBN(contractAddress),
      selector: number.toBN(selector.slice(0, 10)),
      calldata: hexStringToIntegerArray(data.slice(2)),
    };
  }

  /**
   * @inheritDoc
   */
  getCellPrice(): Promise<number> {
    return Promise.resolve(0);
  }

  /**
   * @inheritDoc
   */
  nRow(): Promise<number> {
    return Promise.resolve(N_ROW);
  }

  /**
   * @inheritDoc
   */
  async ownerOf(tokenId: number): Promise<BN> {
    try {
      return await this.contract
        .ownerOf(tokenId)
        .then((address: string) => new BN(address));
    } catch (error) {
      console.log("ownerOf", error);
      return new BN(0);
    }
  }

  /**
   * @inheritDoc
   */
  async renderCell(tokenId: number): Promise<CellRendered> {
    try {
      const cell = await this.contract.renderCell(tokenId);
      return {
        id: tokenId,
        value: number.toBN(cell.value),
        owner: number.toBN(cell.owner),
      };
    } catch (error) {
      console.log("renderCell", error);
      const owner = await this.ownerOf(tokenId);
      return {
        id: tokenId,
        value: new BN(0),
        owner: owner,
        error: true,
      } as CellRendered;
    }
  }

  /**
   * @inheritDoc
   */
  async renderCells(): Promise<CellRendered[]> {
    const totalSupply = await this.totalSupply();
    const tokenIds = await Promise.all(
      Array.from(Array(totalSupply).keys()).map((i) =>
        this.contract.tokenByIndex(i)
      )
    );
    return Promise.all(tokenIds.map((id) => this.renderCell(id.toNumber())));
  }

  /**
   * @inheritDoc
   */
  async totalSupply(): Promise<number> {
    const totalSupply = await this.contract.totalSupply();
    return totalSupply.toNumber();
  }

  /**
   * @inheritDoc
   */
  async name(): Promise<string> {
    return await this.contract.name();
  }

  /**
   * @inheritDoc
   */
  async symbol(): Promise<string> {
    return await this.contract.symbol();
  }
}
