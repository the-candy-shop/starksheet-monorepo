import BN from "bn.js";
import { Contract, ethers, BigNumber } from "ethers";
import { JsonRpcProvider } from "@ethersproject/providers";
import {ABI, Cell, ContractCall} from '../../types';
import { SpreadsheetContract } from "../../types/contracts";

/**
 * Represents an EVM compatible implementation of the SpreadsheetContract.
 */
export class EvmSpreadsheetContract implements SpreadsheetContract {

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
  addSheetTxBuilder(name: string, symbol: string): ContractCall {
    return {
      contractAddress: this.address,
      entrypoint: "addSheet",
      calldata: [name, symbol],
    };
  }

  /**
   * @inheritDoc
   */
  async calculateSheetAddress(): Promise<string> {
    const from = this.address;
    const nonce = await this.provider.getTransactionCount(from);
    return ethers.utils.getContractAddress({ from, nonce })
  }

  /**
   * @inheritDoc
   */
  getSheetDefaultRendererAddress(): Promise<string> {
    return this.contract.defaultRenderer();
  }

  /**
   * @inheritDoc
   */
  async getSheetPrice(): Promise<BN> {
    const value: BigNumber = await this.contract.sheetPrice();
    return new BN(value.toString());
  }

  /**
   * @inheritDoc
   */
  getSheets(): Promise<string[]> {
    return this.contract.sheets();
  }

  /**
   * @inheritDoc
   */
  setCellTxBuilder(cell: Cell & { tokenId: number; sheetAddress: string }): ContractCall {
    return {
      contractAddress: this.address,
      entrypoint: "setCell",
      calldata: [cell.id, cell.contractAddress.toString(), cell.selector, cell.calldata],
    };
  }
}
