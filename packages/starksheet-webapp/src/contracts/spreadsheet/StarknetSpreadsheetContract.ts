import { Call, Contract, hash, number, RpcProvider, stark } from "starknet";
import BN from "bn.js";
import { ABI, Cell, SheetConstructorArgs } from "../../types";
import { bn2hex } from "../../utils/hexUtils";
import { SpreadsheetContract } from "../../types/contracts";

/**
 * Represents a starknet implementation of the SpreadsheetContract.
 */
export class StarknetSpreadsheetContract implements SpreadsheetContract {
  private contract: Contract;

  /**
   * The proxy contract class hash.
   */
  private proxyClassHash: Promise<string>;

  /**
   * The sheet contract class hash.
   */
  private sheetClashHash: Promise<string>;

  /**
   * The class constructor.
   */
  constructor(private address: string, private abi: ABI, provider: RpcProvider) {
    this.contract = new Contract(
      abi,
      address,
      provider,
    );
    this.proxyClassHash = this.getProxyClassHash();
    this.sheetClashHash = this.getSheetClassHash();
  }

  /**
   * @inheritDoc
   */
  async getSheetDefaultRendererAddress(): Promise<string> {
    const renderer = await this.contract.functions[
      "getSheetDefaultRendererAddress"
      ]();
    return bn2hex(renderer.address);
  }

  /**
   * @inheritDoc
   */
  async getSheets(): Promise<string[]> {
    const { addresses } = await this.contract.functions["getSheets"]();
    return addresses.map((address: BN) => bn2hex(address));
  }

  /**
   * @inheritDoc
   */
  async getSheetPrice(): Promise<BN> {
    const price = await this.contract.functions["getSheetPrice"]();
    return price.price;
  }

  /**
   * @inheritDoc
   */
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

  /**
   * @inheritDoc
   */
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

  /**
   * @inheritDoc
   */
  async calculateSheetAddress(
    salt: number.BigNumberish,
    constructorCalldata: SheetConstructorArgs,
  ): Promise<string> {
    const classHash = await this.proxyClassHash;

    const extendedCall = {
      proxyAdmin: constructorCalldata.owner,
      implementation: await this.sheetClashHash,
      selector: hash.getSelectorFromName("initialize"),
      calldataLen: 6,
      name: constructorCalldata.name,
      symbol: constructorCalldata.symbol,
      owner: constructorCalldata.owner,
      merkleRoot: 0,
      maxPerWallet: 0,
      rendererAddress: constructorCalldata.rendererAddress,
    };

    const args = Object.values(extendedCall);

    return Promise.resolve(hash.calculateContractAddressFromHash(
      salt,
      classHash,
      args,
      this.address
    ));
  }

  /**
   * Get the sheet class hash.
   *
   * Specific to starknet, class hash do not exist in EVM based chains.
   */
  private async getSheetClassHash(): Promise<string> {
    const classHash = await this.contract.functions["getSheetClassHash"]();
    return bn2hex(classHash.hash);
  }

  /**
   * Get the proxy class hash.
   *
   * Specific to starknet, class hash do not exist in EVM based chains.
   */
  private async getProxyClassHash(): Promise<string> {
    const classHash = await this.contract.functions["getProxyClassHash"]();
    return bn2hex(classHash.hash);
  }
}
