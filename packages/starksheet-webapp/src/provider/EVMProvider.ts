import { JsonRpcProvider } from "@ethersproject/providers";
import { Contract, ethers } from "ethers";
import {
  ABI,
  ChainConfig,
  ChainId,
  ChainProvider,
  ChainType,
  ContractCall,
  TransactionReceipt,
  WorksheetContract,
} from "../types";
import { EvmSpreadsheetContract, EvmWorksheetContract } from "../contracts";
import { chainAbi } from "./chains";
import { Call } from "starknet";

/**
 * Represents an EVM-compatible implementation of the chain provider.
 */
export class EVMProvider implements ChainProvider {
  /**
   * The ABI dictionary.
   */
  private cachedAbis: Record<string, ABI> = {
    '0x0000000000000000000000000000000000000000': [],
    '0x100000000000000000000000000000000': [],
  };

  /**
   * Constructs an EVM Provider.
   */
  constructor(private provider: JsonRpcProvider, private config: ChainConfig) {}

  /**
   * Builds an EVM provider for the given rpc and config
   */
  public static build(rpcUrl: string, config: ChainConfig): EVMProvider {
    const provider = new JsonRpcProvider(rpcUrl)
    return new EVMProvider(provider, config);
  }

  /**
   * @inheritDoc
   */
  async callContract(options: ContractCall): Promise<string> {
    const abi = await this.getAbi(options.contractAddress);
    const contract = new Contract(options.contractAddress, abi, this.provider);
    const functionDefinition = contract.interface.getFunction(options.entrypoint);

    const result = await contract[options.entrypoint](...(options.calldata || []));
    const resultType = functionDefinition.outputs![0];

    // checks if the result is of type number
    if (resultType.type.startsWith('uint') || resultType.type.startsWith('int')) {
      return result as string;
    }
    // checks if the result is of type string
    if (resultType.type === 'string') {
      const bytes = ethers.utils.toUtf8Bytes(result);
      const hex = ethers.utils.hexlify(bytes);
      return ethers.BigNumber.from(hex).toString();
    }

    throw new Error(`Unhandled return type (${resultType})`);
  }

  /**
   * @inheritDoc
   */
  async getAbi(address: string): Promise<ABI> {
    const cachedAbi = this.cachedAbis[address];
    if (cachedAbi) {
      console.log(`abi retrieved from cache for address ${address}`);
      return cachedAbi;
    } else {
      console.log(`no cache match for address ${address}, fetching from block explorer`)
    }

    // build the query parameters
    const params = new URLSearchParams({
      action: "getabi",
      address,
      apikey: process.env.REACT_APP_EXPLORER_KEY || "",
      module: "contract",
    });
    // build the query url
    const url = new URL(this.config.explorerApiUrl!);
    url.search = params.toString();

    const rawAbi = await fetch(url)
      // check the response is not an error and decode its content to json
      .then((response) => {
        if (!response.ok) {
          throw response.statusText;
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

    if (rawAbi === 'Contract source code not verified') {
      return [];
      // todo: throw error
    }

    if (rawAbi === 'Invalid Address format') {
      return [];
      // todo: throw error
    }

    // parse the raw abi and return it
    const abi = JSON.parse(rawAbi);
    this.cachedAbis[address] = abi;
    return abi;
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
    const abi = chainAbi[this.config.chainType].spreadsheet;

    return new EvmSpreadsheetContract(address, abi, this.provider);
  }

  /**
   * @inheritDoc
   */
  async getTransactionReceipt(hash: string): Promise<TransactionReceipt> {
    const receipt = await this.provider.getTransactionReceipt(hash);
    return {
      transaction_hash: receipt.transactionHash,
      status: receipt.status,
    }
  }

  /**
   * @inheritDoc
   */
  getWorksheetContractByAddress(address: string): WorksheetContract {
    const abi = chainAbi[this.config.chainType].worksheet;
    return new EvmWorksheetContract(address, abi, this.provider);
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
  execute = async (calls: Call[], options: { value: number | string })  => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();


    // Callers of the execute function assume the chain supports multi-call, which EVM does not natively.
    // The following is a hack: we wait for every transaction before resolving, then returning one of the transactions.
    // This works because callers do not really care about the transaction response, only its status and completion
    const receipts = await Promise.all(calls.map(async (call) => {
      const abi = await this.getAbi(call.contractAddress);
      const contract = new Contract(call.contractAddress, abi, signer);

      const response: ethers.providers.TransactionResponse = await contract[call.entrypoint](...(call.calldata || []), {
        value: options.value,
      });
      return await response.wait();
      }));

    const firstToFail = receipts.find((receipt) => receipt.status !== 1)
    if (firstToFail) {
      return {
        transaction_hash: firstToFail.transactionHash,
      };
    }

    return {
      transaction_hash: receipts[0].transactionHash,
    }
  }

  async login(): Promise<string> {
    if (!window.ethereum) {
      throw new Error("Metamask not detected");
    }

    try {
      const accounts = await window.ethereum.request({method: 'eth_requestAccounts'});
      return accounts[0];
    } catch (error) {
      throw new Error("login failed");
    }
  }
}
