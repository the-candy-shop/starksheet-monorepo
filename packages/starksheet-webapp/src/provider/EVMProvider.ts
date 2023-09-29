import { JsonRpcProvider } from "@ethersproject/providers";
import { ethers } from "ethers";
import { MetaTransaction, OperationType, encodeMulti } from "ethers-multisend";
import { EvmSpreadsheetContract, EvmWorksheetContract } from "../contracts";
import { MultiSendCallOnly__factory } from "../contracts/types";
import {
  Abi,
  ChainConfig,
  ChainId,
  ChainProvider,
  ChainType,
  ContractAbi,
  ContractCall,
  TransactionReceipt,
  WorksheetContract,
} from "../types";
import { bigint2hex, bigint2uint, normalizeHexString } from "../utils/hexUtils";
import { chainConfig } from "./chains";

/**
 * Represents an EVM-compatible implementation of the chain provider.
 */
export class EVMProvider implements ChainProvider {
  /**
   * Constructs an EVM Provider.
   */
  constructor(
    private provider: JsonRpcProvider,
    private config: ChainConfig,
  ) {}

  async addressAlreadyDeployed(address: string) {
    return (await this.provider.getCode(address)).length > 2;
  }

  /**
   * Builds an EVM provider for the given rpc and config
   */
  public static build(rpcUrl: string, config: ChainConfig): EVMProvider {
    const provider = new JsonRpcProvider(rpcUrl);
    return new EVMProvider(provider, config);
  }

  /**
   * @inheritDoc
   */
  async callContract(call: ContractCall): Promise<string> {
    const result = await this.provider.call({
      to: call.to,
      data: this.contractCallToEVMCalldata(call),
    });
    return result;
  }

  /**
   *
   * Convert a ContractCall to an EVM call. The  bigints are converted using bigint2uint (ie. padding with 0 at left) because
   * they come from hex strings,
   * @param call
   * @returns
   */
  contractCallToEVMCalldata(call: ContractCall): string {
    return (
      "0x" +
      bigint2uint(4)(BigInt("0x" + call.selector!.toString(16))) +
      (call.calldata as bigint[]).map(bigint2uint(32)).join("")
    );
  }

  /**
   * @inheritDoc
   */
  async getAbi(address: string): Promise<Abi> {
    // build the query parameters
    const params = new URLSearchParams({
      action: "getabi",
      address,
      apikey: chainConfig.explorerApiKey || "",
      module: "contract",
    });
    // build the query url
    const url = new URL(this.config.explorerApiUrl!);
    url.search = params.toString();

    let abi: Abi = [];
    try {
      const rawAbi = await fetch(url)
        // check the response is not an error and decode its content to json
        .then((response) => {
          if (!response.ok) {
            return { result: [] };
          }
          return response.json();
        })
        // check the body of the response contains a "result" and returns it
        .then((data) => {
          if (!data.result) {
            throw new Error(`Unexpected error, got ${JSON.stringify(data)}`);
          }
          return data.result;
        });

      if (rawAbi === "Contract source code not verified") {
        return [];
        // todo: throw error
      }

      if (rawAbi === "Invalid Address format") {
        return [];
        // todo: throw error
      }

      // parse the raw abi and return it
      abi = JSON.parse(rawAbi);
      const iface = new ethers.utils.Interface(abi);
      const others = await Promise.all(
        iface.fragments
          .filter(
            (f: any) =>
              f.type === "function" &&
              f.stateMutability === "view" &&
              f.inputs.length === 0 &&
              f.name.toLowerCase().includes("impl"),
          )
          .map(async (f) => {
            const implementationAddress = (
              await this.provider.call({
                to: address,
                data: iface.getSighash(f),
              })
            )
              .slice(2)
              .replace(/^0+/, "");
            return Object.values(
              (await this.getAbi("0x" + implementationAddress)) || {},
            ) as Abi;
          }),
      );
      abi = [...abi, ...others.flat()];
    } catch (error) {
      abi = [];
    }
    return abi as Abi;
  }

  parseAbi(abi: Abi): ContractAbi {
    try {
      const iface = new ethers.utils.Interface(abi);
      return iface.fragments
        .filter((fragment) => fragment.type === "function")
        .reduce(
          (prev, cur) => ({
            ...prev,
            [normalizeHexString(iface.getSighash(cur))]: cur,
          }),
          {},
        );
    } catch (error) {
      console.log(
        `Couldn't parse the following ABI\n${abi}\n\nError: ${error}`,
      );
      return {};
    }
  }

  /**
   * @inheritDoc
   */
  getChainId(): ChainId {
    return this.config.chainId;
  }

  /**
   * @inheritDoc
   */
  getChainType(): ChainType {
    return this.config.chainType;
  }

  /**
   * @inheritDoc
   */
  getExplorerAddress(contractAddress: string): string {
    return `${this.config.explorerBaseUrl}${contractAddress}`;
  }

  /**
   * @inheritDoc
   */
  getNftMarketplaceAddress(contractAddress: string): string {
    return `${this.config.nftBaseUrl}${contractAddress}`;
  }

  /**
   * @inheritDoc
   */
  getSpreadsheetContract(): EvmSpreadsheetContract {
    const address = this.config.addresses.spreadsheet;
    return new EvmSpreadsheetContract(address, this.provider);
  }

  /**
   * @inheritDoc
   */
  async getTransactionReceipt(hash: string): Promise<TransactionReceipt> {
    const receipt = await this.provider.getTransactionReceipt(hash);
    return {
      transaction_hash: receipt.transactionHash,
      status: receipt.status,
    };
  }

  /**
   * @inheritDoc
   */
  getWorksheetContractByAddress(address: string): WorksheetContract {
    return new EvmWorksheetContract(address, this.provider);
  }

  /**
   * @inheritDoc
   */
  async waitForTransaction(hash: string): Promise<void> {
    const transaction = await this.provider.getTransaction(hash);
    await transaction.wait();
  }

  /**
   * @inheritDoc
   */
  execute = async (
    calls: ContractCall[],
    options: { [address: string]: { value: number | string } },
  ) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    const transactions: MetaTransaction[] = calls.map((call) => ({
      to: call.to,
      value: call.value ? bigint2hex(call.value) : "0x0",
      data: call.calldata as string,
      operation: OperationType.Call,
    }));

    const transaction =
      "0x" +
      encodeMulti(transactions, chainConfig.addresses.multisend).data.slice(
        2 * (1 + 4 + 32 + 32),
      );

    const value = transactions
      .map((tx) => BigInt(tx.value))
      .reduce((prev, cur) => prev + cur, 0n);

    const multisend = MultiSendCallOnly__factory.connect(
      chainConfig.addresses.multisend!,
      signer,
    );
    const overrides = value > 0n ? { value: bigint2hex(value) } : {};
    const tx = await multisend.multiSend(
      // encodeMulti creates a new MetaTransaction, and the data includes to bytes selector and bytes lengths
      // So we slices "0x" + bytes4 + 2 times bytes.length
      transaction,
      overrides,
    );
    const receipt = await tx.wait();

    return {
      transaction_hash: receipt.transactionHash,
    };
  };

  async login(): Promise<string> {
    if (!window.ethereum) {
      throw new Error("Metamask not detected");
    }

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      return accounts[0];
    } catch (error) {
      throw new Error("login failed");
    }
  }

  sendEthTxBuilder(recipientAddress: bigint, amount: bigint) {
    return {
      to: recipientAddress.toString(16),
      entrypoint: "",
      value: amount,
      calldata: "",
      operation: OperationType.Call,
    };
  }
}
