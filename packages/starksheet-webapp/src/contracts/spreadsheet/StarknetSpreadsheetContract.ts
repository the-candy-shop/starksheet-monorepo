import { Cell } from "../../types";
import { Abi, Call, Contract, hash, number, RpcProvider, stark } from "starknet";
import starksheetContractData from "../../contract.json";
import { bn2hex } from "../../utils/hexUtils";
import BN from "bn.js";
import { SpreadsheetContract } from "../../types/contracts";

export class StarknetSpreadsheetContract implements SpreadsheetContract {
  private contract: Contract;
  public address: string;

  constructor(provider: RpcProvider) {
    this.contract = new Contract(
      starksheetContractData.onsheetAbi as Abi,
      starksheetContractData.address,
      provider
    );
    this.address = starksheetContractData.address;
  }

  async getSheetDefaultRendererAddress(): Promise<string> {
    const renderer = await this.contract.functions[
      "getSheetDefaultRendererAddress"
      ]();
    return bn2hex(renderer.address);
  }

  async getSheetClassHash(): Promise<string> {
    const classHash = await this.contract.functions["getSheetClassHash"]();
    return bn2hex(classHash.hash);
  }

  async getProxyClassHash(): Promise<string> {
      const classHash = await this.contract.functions["getProxyClassHash"]();
    return bn2hex(classHash.hash);
  }

  async getSheets(): Promise<string[]> {
    const { addresses } = await this.contract.functions["getSheets"]();
    return addresses.map((address: BN) => bn2hex(address));
  }

  async getSheetPrice(): Promise<BN> {
    const price = await this.contract.functions["getSheetPrice"]();
    return price.price;
  }

  setCellTxBuilder(
    cell: Cell & { tokenId: number; sheetAddress: string }
  ): Call {
    return cell.owner.eq(number.toBN(0))
      ? {
        contractAddress: cell.sheetAddress,
        entrypoint: "mintAndSetPublic",
        calldata: stark.compileCalldata({
          tokenId: {
            type: "struct",
            low: cell.tokenId,
            high: 0,
          },
          proof: [],
          contractAddress: cell.contractAddress.toString(),
          value: cell.selector.toString(),
          cellCalldata: cell.calldata.map((d) => d.toString()),
        }),
      }
      : {
        contractAddress: cell.sheetAddress,
        entrypoint: "setCell",
        calldata: stark.compileCalldata({
          tokenId: cell.tokenId.toString(),
          contractAddress: cell.contractAddress.toString(),
          value: cell.selector.toString(),
          cellCalldata: cell.calldata.map((d) => d.toString()),
        }),
      };
  }

  addSheetTxBuilder(name: string, symbol: string): Call {
    return {
      contractAddress: this.address,
      entrypoint: "addSheet",
      calldata: stark.compileCalldata({
        name,
        symbol,
        proof: [],
      }),
    };
  }

  calculateSheetAddress(
    salt: number.BigNumberish,
    classHash: number.BigNumberish,
    constructorCalldata: number.BigNumberish[]
  ): Promise<string> {
    return Promise.resolve(hash.calculateContractAddressFromHash(
      salt,
      classHash,
      constructorCalldata,
      this.address
    ));
  }
}
