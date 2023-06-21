import { JsonRpcProvider } from "@ethersproject/providers";
import BN from "bn.js";
import { BigNumber, Contract, ethers } from "ethers";
import { ABI, Cell, ContractCall } from "../../types";
import { SpreadsheetContract } from "../../types/contracts";
import { bn2hex, hex2str } from "../../utils/hexUtils";

/**
 * Represents an EVM compatible implementation of the SpreadsheetContract.
 */
export class EvmSpreadsheetContract implements SpreadsheetContract {
  private contract: Contract;

  /**
   * The class constructor.
   */
  constructor(
    private address: string,
    private abi: ABI,
    private provider: JsonRpcProvider
  ) {
    console.log("abi", abi);
    this.contract = new Contract(address, abi, provider);
  }

  /**
   * @inheritDoc
   */
  addSheetTxBuilder(name: string, symbol: string): ContractCall {
    const decodedName = hex2str(name);
    const decodedSymbol = hex2str(symbol);

    return {
      contractAddress: this.address,
      entrypoint: "addSheet",
      calldata: [decodedName, decodedSymbol],
    };
  }

  /**
   * @inheritDoc
   */
  async calculateSheetAddress(): Promise<string> {
    const from = this.address;
    const nonce = await this.provider.getTransactionCount(from);
    return ethers.utils.getContractAddress({ from, nonce });
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
    return this.contract.sheets();
  }

  /**
   * @inheritDoc
   */
  setCellTxBuilder(
    cell: Cell & { tokenId: number; sheetAddress: string }
  ): ContractCall {
    const contractAddress = bn2hex(cell.contractAddress);

    const selector = ethers.BigNumber.from(cell.selector.toString());
    const value = ethers.utils.hexZeroPad(selector.toHexString(), 32);

    let calldata = [0];
    if (cell.calldata.length > 0) {
      calldata = cell.calldata.map((val) => Number(bn2hex(val)));
    }

    const data = ethers.utils.solidityPack(["uint256"], [calldata]);

    return {
      contractAddress: cell.sheetAddress,
      entrypoint: "setCell",
      calldata: [cell.id, contractAddress, value, data],
    };
  }
}
