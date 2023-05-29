/**
 * Represents a contract call.
 *
 * This type provides add additional abstraction layer with respect to chain base representations to allow cross-chain
 * support.
 */
export interface ContractCall {
  /**
   * The contract address.
   */
  contractAddress: string;

  /**
   * The entry point to call.
   */
  entrypoint: any;

  /**
   * Some optional data the call might need (method params).
   */
  calldata?: any;
}