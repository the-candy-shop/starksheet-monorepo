import { JsonRpcProvider } from "@ethersproject/providers";
import { N_ROW } from "../../config";
import { CellData, CellRendered, WorksheetContract } from "../../types";
import { RC_BOUND } from "../../utils/constants";
import { hexStringToIntegerArray } from "../../utils/hexUtils";
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

    return {
      contractAddress: BigInt(contractAddress),
      selector:
        BigInt(contractAddress) === RC_BOUND
          ? BigInt(selector)
          : BigInt(selector.slice(0, 10)),
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
  async ownerOf(tokenId: number): Promise<bigint> {
    try {
      return await this.contract
        .ownerOf(tokenId)
        .then((address: string) => BigInt(address));
    } catch (error) {
      return 0n;
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
        value: BigInt(cell.value),
        owner: BigInt(cell.owner),
      };
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
