import {
  BigNumberish,
  CallData,
  Contract,
  hash,
  ProviderInterface,
} from "starknet";
import {
  Abi,
  Cell,
  ContractCall,
  SheetConstructorArgs,
  SpreadsheetContract,
} from "../../types";
import { bigint2hex } from "../../utils/hexUtils";

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
  constructor(
    private address: string,
    private abi: Abi,
    provider: ProviderInterface,
  ) {
    this.contract = new Contract(abi, address, provider);
    this.proxyClassHash = this.getProxyClassHash();
    this.sheetClashHash = this.getSheetClassHash();
  }

  async getSheetImplementation(): Promise<bigint> {
    const classHash = await this.contract.functions["getSheetClassHash"]();
    return classHash.hash;
  }

  /**
   * @inheritDoc
   */
  async getSheetDefaultRendererAddress(): Promise<string> {
    const renderer =
      await this.contract.functions["getSheetDefaultRendererAddress"]();
    return bigint2hex(renderer.address);
  }

  /**
   * @inheritDoc
   */
  async getSheets(): Promise<string[]> {
    const { addresses } = await this.contract.functions["getSheets"]();
    return addresses.map((address: bigint) => bigint2hex(address));
  }

  /**
   * @inheritDoc
   */
  async getSheetPrice(): Promise<bigint> {
    const price = await this.contract.functions["getSheetPrice"]();
    return price.price;
  }

  /**
   * @inheritDoc
   */
  setCellTxBuilder(
    cell: Cell & { tokenId: number; sheetAddress: string },
  ): ContractCall {
    return cell.owner === 0n
      ? {
          to: cell.sheetAddress,
          entrypoint: "mintAndSetPublic",
          calldata: CallData.compile({
            tokenId: {
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
          to: cell.sheetAddress,
          entrypoint: "setCell",
          calldata: CallData.compile({
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
  addSheetTxBuilder(name: string, symbol: string, from: string): ContractCall {
    return {
      to: this.address,
      entrypoint: "addSheet",
      calldata: CallData.compile({
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
    from: BigNumberish,
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
      merkleRoot: constructorCalldata.merkleRoot,
      maxPerWallet: constructorCalldata.maxPerWallet,
      rendererAddress: constructorCalldata.rendererAddress,
    };

    const args = Object.values(extendedCall);

    return Promise.resolve(
      hash.calculateContractAddressFromHash(
        from,
        classHash,
        args,
        this.address,
      ),
    );
  }

  /**
   * Get the sheet class hash.
   *
   * Specific to starknet, class hash do not exist in EVM based chains.
   */
  private async getSheetClassHash(): Promise<string> {
    const classHash = await this.contract.functions["getSheetClassHash"]();
    return bigint2hex(classHash.hash);
  }

  /**
   * Get the proxy class hash.
   *
   * Specific to starknet, class hash do not exist in EVM based chains.
   */
  private async getProxyClassHash(): Promise<string> {
    const classHash = await this.contract.functions["getProxyClassHash"]();
    return bigint2hex(classHash.hash);
  }
}
