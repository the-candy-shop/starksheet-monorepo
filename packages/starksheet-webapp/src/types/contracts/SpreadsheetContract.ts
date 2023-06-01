import BN from "bn.js";
import { Cell } from "../cells";
import { ContractCall } from "../provider";
import { SheetConstructorArgs } from "../onsheet";

export interface SpreadsheetContract {
  getSheetDefaultRendererAddress(): Promise<string>;
  getSheets(): Promise<string[]>;
  setCellTxBuilder(
    cell: Cell & { tokenId: number; sheetAddress: string }
  ): ContractCall;
  addSheetTxBuilder(name: string, symbol: string): ContractCall;
  calculateSheetAddress(
    salt: number | string,
    constructorCalldata: SheetConstructorArgs,
  ): Promise<string>;
  getSheetPrice(): Promise<BN>;
}
