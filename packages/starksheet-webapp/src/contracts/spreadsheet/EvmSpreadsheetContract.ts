import BN from "bn.js";
import { Contract, ethers } from "ethers";
import { JsonRpcProvider } from "@ethersproject/providers";
import abi from "./evm.abi.json";
import { Cell, ContractCall } from "../../types";
import { SpreadsheetContract } from "../../types/contracts";

/**
 * Represents an EVM compatible implementation of the SpreadsheetContract.
 */
export class EvmSpreadsheetContract implements SpreadsheetContract {

  private contract: Contract;

  /**
   * The class constructor.
   */
  constructor(private address: string, private provider: JsonRpcProvider) {
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
  getProxyClassHash(): Promise<string> {
    return Promise.resolve("0x0");
  }

  /**
   * @inheritDoc
   */
  getSheetClassHash(): Promise<string> {
    return Promise.resolve("0x0");
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
  getSheetPrice(): Promise<BN> {
    return this.contract.sheetPrice();
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
