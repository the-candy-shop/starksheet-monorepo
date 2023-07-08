import BN from "bn.js";
import { Cell } from "../cells";
import { SheetConstructorArgs } from "../onsheet";
import { ContractCall } from "../provider";

export interface SpreadsheetContract {
  getSheetDefaultRendererAddress(): Promise<string>;
  getSheets(): Promise<string[]>;
  calculateSheetAddress(
    from: number | string,
    constructorCalldata: SheetConstructorArgs
  ): Promise<string>;
  getSheetPrice(): Promise<BN>;
  /**
   * Build a raw `setCell` transaction from a Cell.
   *
   * @param cell the cell to be saved (possibly also minted)
   */
  setCellTxBuilder(
    cell: Cell & { tokenId: number; sheetAddress: string }
  ): ContractCall;
  /**
   * Build a raw `addSheet` transaction
   *
   * @param name
   * @param symbol
   */
  addSheetTxBuilder(name: string, symbol: string, from: string): ContractCall;
}
