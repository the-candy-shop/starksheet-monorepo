import { Call } from "starknet";
import { Cell } from "../cells";
import { BigNumberish } from "starknet/utils/number";

export interface Onsheet {
  getSheetDefaultRendererAddress(): Promise<string>;
  getSheetClassHash(): Promise<string>;
  getSheets(): Promise<string[]>;
  setCellTxBuilder(
    cell: Cell & { tokenId: number; sheetAddress: string }
  ): Call;
  addSheetTxBuilder(name: string, symbol: string): Call;
  calculateSheetAddress(
    salt: BigNumberish,
    classHash: BigNumberish,
    constructorCalldata: BigNumberish[],
    deployerAddress: BigNumberish
  ): string;
}
