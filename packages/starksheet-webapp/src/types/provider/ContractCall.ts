import BN from "bn.js";
import { BigNumberish } from "ethers";
import { FunctionAbi } from "starknet";

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
  to: string;

  /**
   * The entry point to call.
   */
  entrypoint?: any;

  /**
   * The function selector.
   */
  selector?: BigNumberish | BN;

  /**
   * The calldata. In the EVM world, the calldata includes the bytes4 function selector.
   */
  calldata: (BigNumberish | BN)[] | string;

  /**
   * The value to send in chain base fee token
   */
  value?: any;

  /**
   * The abi of the contract at address to
   */
  abi?: FunctionAbi;
}
