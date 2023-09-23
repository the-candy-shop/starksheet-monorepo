import { ContractCall } from "..";
import { CellData, CellRendered } from "../cells";

export interface WorksheetContract {
  totalSupply(): Promise<number>;
  ownerOf(tokenId: number): Promise<bigint>;
  getCell(tokenId: number): Promise<CellData>;
  renderCell(tokenId: number): Promise<CellRendered>;
  renderCells(): Promise<CellRendered[]>;
  nRow(): Promise<number>;
  getCellPrice(): Promise<bigint>;
  getSheetPrice(): Promise<bigint>;
  name(): Promise<string>;
  symbol(): Promise<string>;
  owner(): Promise<bigint>;
  implementation(): Promise<bigint>;
  setImplementation(newImplementation: bigint): ContractCall;
}
