import BN from "bn.js";
import { useMemo } from "react";
import { Abi, Call, Contract, stark } from "starknet";
import { calculateContractAddressFromHash } from "starknet/dist/utils/hash";
import { BigNumberish, toBN } from "starknet/utils/number";
import starksheetContractData from "../contract.json";
import { starknetRpcProvider } from "../provider";
import { Cell, OnsheetContract } from "../types";
import { bn2hex } from "../utils/hexUtils";

class StarksheetContract implements OnsheetContract {
  private contract: Contract;
  public address: string;

  constructor() {
    this.contract = new Contract(
      starksheetContractData.onsheetAbi as Abi,
      starksheetContractData.address,
      starknetRpcProvider
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

  async getSheets(): Promise<string[]> {
    const { addresses } = await this.contract.functions["getSheets"]();
    return addresses.map((address: BN) => bn2hex(address));
  }

  setCellTxBuilder(
    cell: Cell & { tokenId: number; sheetAddress: string }
  ): Call {
    return cell.owner.eq(toBN(0))
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
    salt: BigNumberish,
    classHash: BigNumberish,
    constructorCalldata: BigNumberish[],
    deployerAddress: BigNumberish
  ): string {
    return calculateContractAddressFromHash(
      salt,
      classHash,
      constructorCalldata,
      deployerAddress
    );
  }
}

export function useOnsheetContract() {
  const contract = useMemo(() => new StarksheetContract(), []);

  return { contract };
}
