import { useMemo } from "react";
import { Abi, Contract } from "starknet";
import starksheetContractData from "../contract.json";
import { starknetRpcProvider } from "../provider";
import { OnsheetContract } from "../types";
import { bn2hex } from "../utils/hexUtils";

class StarksheetContract implements OnsheetContract {
  private contract: Contract;

  constructor() {
    this.contract = new Contract(
      starksheetContractData.onsheetAbi as Abi,
      starksheetContractData.address,
      starknetRpcProvider
    );
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
    return addresses;
  }
}

export function useOnsheetContract() {
  const contract = useMemo(() => new StarksheetContract(), []);

  return { contract };
}
