import { ABI } from "./ABI";
import { ContractCall } from "./ContractCall";
import { TransactionReceipt } from "./TransactionReceipt";
import { ChainType } from "./ChainType";
import { ChainId } from "./ChainId";
import { SpreadsheetContract, WorksheetContract } from "../contracts";

/**
 * Represents a chain provider.
 *
 * This interface describes every method the application needs to interact with on-chain data..
 */
export interface ChainProvider {
  /**
   * Gets the ABI of the contract matching the given address.
   */
  getAbi(address: string): Promise<ABI>;

  /**
   * Calls a contract entry point with some optional data.
   */
  callContract<T>(options: ContractCall): Promise<T>;

  /**
   * Waits for the transaction matching the given hash to complete.
   */
  waitForTransaction(hash: string): Promise<void>;

  /**
   * Gets the chain id.
   */
  getChainId(): ChainId;

  /**
   * Gets the chain type.
   */
  getChainType(): ChainType;

  /**
   * Gets a spreadsheet contract implementation matching the chain type.
   */
  getSpreadsheetContract(): SpreadsheetContract;

  /**
   * Gets a worksheet contract implementation matching the chain type for the given address.
   */
  getWorksheetContractByAddress(address: string): WorksheetContract;

  /**
   * Gets the receipt of the transaction matching the given hash.
   */
  getTransactionReceipt(hash: string): Promise<TransactionReceipt>;

  /**
   * Gets the address (url) of the explorer for the current chain.
   */
  getExplorerAddress(contractAddress: string): string;

  /**
   * Gets the address (url) of the nft marketplace for the current chain.
   */
  getNftMarketplaceAddress(contractAddress: string): string;
}
