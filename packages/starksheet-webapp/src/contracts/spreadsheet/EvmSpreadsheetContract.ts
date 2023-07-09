import { JsonRpcProvider } from "@ethersproject/providers";
import BN from "bn.js";
import { BigNumber, ethers } from "ethers";
import { Cell, ContractCall, SheetConstructorArgs } from "../../types";
import { SpreadsheetContract } from "../../types/contracts";
import { RC_BOUND } from "../../utils/constants";
import { bn2uint, hex2str } from "../../utils/hexUtils";
import { Evmsheet, Evmsheet__factory, Sheet__factory } from "../types";

/**
 * Represents an EVM compatible implementation of the SpreadsheetContract.
 */
export class EvmSpreadsheetContract implements SpreadsheetContract {
  private contract: Evmsheet;
  private sheetPrice: BN;

  /**
   * The class constructor.
   */
  constructor(private address: string, private provider: JsonRpcProvider) {
    this.sheetPrice = new BN(0);
    this.contract = Evmsheet__factory.connect(address, provider);
    this.getSheetPrice().then((price) => {
      this.sheetPrice = price;
    });
  }

  getSalt(name: string, symbol: string, from: string) {
    return ethers.utils.keccak256(
      ethers.utils.solidityPack(
        ["string", "string", "address"],
        [name, symbol, from]
      )
    );
  }

  /**
   * @inheritDoc
   */
  async calculateSheetAddress(
    from: string,
    constructorCalldata: SheetConstructorArgs
  ): Promise<string> {
    const decodedName = hex2str(constructorCalldata.name.toString(16));
    const decodedSymbol = hex2str(constructorCalldata.symbol.toString(16));
    const salt = this.getSalt(decodedName, decodedSymbol, from);
    return await this.contract.getSheetCreationAddress(this.address, salt);
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
    return this.contract.getSheets();
  }

  /**
   * @inheritDoc
   */
  addSheetTxBuilder(name: string, symbol: string, from: string): ContractCall {
    const decodedName = hex2str(name);
    const decodedSymbol = hex2str(symbol);
    const salt = this.getSalt(decodedName, decodedSymbol, from);
    const calldata = Evmsheet__factory.createInterface().encodeFunctionData(
      "addSheet",
      [decodedName, decodedSymbol, salt]
    );

    return {
      to: this.address,
      calldata,
      value: this.sheetPrice,
    };
  }

  /**
   * @inheritDoc
   */
  setCellTxBuilder(
    cell: Cell & { tokenId: number; sheetAddress: string }
  ): ContractCall {
    // If contractAddress is RC_BOUND, then the cell is constant and we store the selector
    // as a regular uint256
    const selector = cell.contractAddress.eq(RC_BOUND)
      ? bn2uint(32)(cell.selector)
      : bn2uint(4)(cell.selector).padEnd(64, "0");
    return {
      to: cell.sheetAddress,
      calldata: Sheet__factory.createInterface().encodeFunctionData("setCell", [
        cell.id,
        "0x" + bn2uint(20)(cell.contractAddress),
        "0x" + selector,
        "0x" + cell.calldata.map(bn2uint(32)).join(""),
      ]),
    };
  }
}
