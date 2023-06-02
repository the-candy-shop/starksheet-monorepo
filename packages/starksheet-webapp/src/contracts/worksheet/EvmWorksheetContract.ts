import BN from "bn.js";
import { Contract } from "ethers";
import { JsonRpcProvider } from "@ethersproject/providers";
import { ABI, CellData, CellRendered, WorksheetContract } from "../../types";

export class EvmWorksheetContract implements WorksheetContract {
  private contract: Contract;

  /**
   * The class constructor.
   */
  constructor(private address: string, private abi: ABI, private provider: JsonRpcProvider) {
    this.contract = new Contract(address, abi, provider);
  }

  /**
   * @inheritDoc
   */
  async getCell(tokenId: number): Promise<CellData> {
    const [contractAddress, value, data] = await this.contract.getCell(tokenId);
    return {
      contractAddress,
      selector: value,
      calldata: data,
    };
  }

  /**
   * @inheritDoc
   */
  getCellPrice(): Promise<number> {
    throw new Error("not implemented");
  }

  /**
   * @inheritDoc
   */
  nRow(): Promise<number> {
    throw new Error("not implemented");
  }

  /**
   * @inheritDoc
   */
  ownerOf(tokenId: number): Promise<BN> {
    return this.contract.ownerOf(tokenId).then((address: string) => new BN(address));
  }

  /**
   * @inheritDoc
   */
  renderCell(tokenId: number): Promise<CellRendered> {
    // todo: catch the error
    return this.contract.renderCell(tokenId);
  }

  /**
   * @inheritDoc
   */
  async renderCells(): Promise<CellRendered[]> {
    const totalSupply = await this.totalSupply();
    const cellIds = Array.from(Array(totalSupply).keys());
    return Promise.all(cellIds.map((id) => this.renderCell(id)));
  }

  /**
   * @inheritDoc
   */
  totalSupply(): Promise<number> {
    return this.contract.totalSupply();
  }
}
