import BN from "bn.js";
import { Cell } from "../cells";
import {ContractCall} from '../provider';

export interface SpreadsheetContract {
  getSheetDefaultRendererAddress(): Promise<string>;
  getSheetClassHash(): Promise<string>;
  getProxyClassHash(): Promise<string>;
  getSheets(): Promise<string[]>;
  setCellTxBuilder(
    cell: Cell & { tokenId: number; sheetAddress: string }
  ): ContractCall;
  addSheetTxBuilder(name: string, symbol: string): ContractCall;
  calculateSheetAddress(
    salt: number | string,
    classHash: number | string,
    constructorCalldata: (number | string)[],
  ): string;
  getSheetPrice(): Promise<BN>;
}
