import BN from "bn.js";
import { Call, number } from "starknet";
import { Cell } from "../cells";

export interface Onsheet {
  getSheetDefaultRendererAddress(): Promise<string>;
  getSheetClassHash(): Promise<string>;
  getProxyClassHash(): Promise<string>;
  getSheets(): Promise<string[]>;
  setCellTxBuilder(
    cell: Cell & { tokenId: number; sheetAddress: string }
  ): Call;
  addSheetTxBuilder(name: string, symbol: string): Call;
  calculateSheetAddress(
    salt: number.BigNumberish,
    classHash: number.BigNumberish,
    constructorCalldata: number.BigNumberish[]
  ): string;
  getSheetPrice(): Promise<BN>;
}
