import BN from "bn.js";
import { BigNumberish, Contract } from "ethers";
import { JsonRpcProvider } from "@ethersproject/providers";
import abi from "./evm.abi.json";
import { Cell, ContractCall } from "../../types";
import { SpreadsheetContract } from "../../types/contracts";

export class EvmSpreadsheet implements SpreadsheetContract {

  private contract: Contract;

  /**
   *
   */
  constructor(private address: string, provider: JsonRpcProvider) {
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
  calculateSheetAddress(salt: BigNumberish, classHash: BigNumberish, constructorCalldata: BigNumberish[]): string {
    throw "unimplemented";
  }

  /**
   * @inheritDoc
   */
  getProxyClassHash(): Promise<string> {
    return this.contract.getProxyClassHash();
  }

  /**
   * @inheritDoc
   */
  getSheetClassHash(): Promise<string> {
    return this.contract.getSheetClassHash();
  }

  /**
   * @inheritDoc
   */
  getSheetDefaultRendererAddress(): Promise<string> {
    return this.contract.getSheetDefaultRendererAddress();
  }

  /**
   * @inheritDoc
   */
  getSheetPrice(): Promise<BN> {
    return this.contract.getSheetPrice();
  }

  /**
   * @inheritDoc
   */
  getSheets(): Promise<string[]> {
    return this.contract.getSheets();
  }

  /**
   * @inheritDoc
   */
  setCellTxBuilder(cell: Cell & { tokenId: number; sheetAddress: string }): ContractCall {
    throw "unimplemented";
  }
}
