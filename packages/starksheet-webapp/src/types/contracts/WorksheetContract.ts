import type BN from "bn.js";
import { CellData, CellRendered } from "../cells";

export interface WorksheetContract {
  totalSupply(): Promise<number>;
  ownerOf(tokenId: number): Promise<BN>;
  getCell(tokenId: number): Promise<CellData>;
  renderCell(tokenId: number): Promise<CellRendered>;
  renderCells(): Promise<CellRendered[]>;
  nRow(): Promise<number>;
  getCellPrice(): Promise<number>;
}
