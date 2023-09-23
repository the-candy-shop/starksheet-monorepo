import { ContractAbi } from "..";
import { SpreadsheetContract, WorksheetContract } from "../contracts";
import { Abi } from "./ABI";
import { ChainId } from "./ChainId";
import { ChainType } from "./ChainType";
import { ContractCall } from "./ContractCall";
import { TransactionReceipt } from "./TransactionReceipt";
import { TransactionResponse } from "./TransactionResponse";

/**
 * Represents a chain provider.
 *
 * This interface describes every method the application needs to interact with on-chain data..
 */
export interface ChainProvider {
  /**
   *
   * Get bytecode at a given address
   */
  addressAlreadyDeployed(address: string): Promise<boolean>;

  /**
   * Gets the ABI of the contract matching the given address.
   */
  getAbi(address: string): Promise<Abi>;

  /**
   * Returns an object whose keys are the selectors of the corresponding functions instead of a raw list
   * @param abi The raw abi
   */
  parseAbi(abi: Abi): ContractAbi;

  /**
   * Calls a contract entry point with some optional data.
   */
  callContract(options: ContractCall): Promise<string>;

  /**
   * Waits for the transaction matching the given hash to complete.
   */
  waitForTransaction(hash: string): Promise<void>;

  /**
   * todo: refactor
   */
  execute(
    calls: ContractCall[],
    options?: { [address: string]: { value?: number | string } }
  ): Promise<TransactionResponse>;

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

  /**
   * Connects the user with the given chain provider.
   */
  login(): Promise<string>;

  /**
   * Create a send ETH transaction
   */
  sendEthTxBuilder(recipientAddress: bigint, amount: bigint): ContractCall;
}
