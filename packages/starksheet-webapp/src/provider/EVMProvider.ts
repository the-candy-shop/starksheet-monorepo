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
import { Call, RawCalldata } from "starknet";
import { TransactionType, encodeSingle, encodeMulti, CallContractTransactionInput } from "ethers-multisend";
import { evmWorksheetAbi } from "../contracts";

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
    const multisendContractAddress = process.env.REACT_APP_MULTISEND_ADDRESS || "";

    const encodeTransactions = await Promise.all(calls.map(async (call, index) => {
      let abi = await this.getAbi(call.contractAddress);

      // Manually setting the ABI for evm worksheet contract
      // we get an empty array for evm worksheet contract abi because evm worksheet contract source code not verified
      if(abi.length === 0) {
        abi = evmWorksheetAbi;
      }

      const contract = new Contract(call.contractAddress, abi, signer);

      const fragment = contract.interface.fragments.find((fragment) => fragment.name === call.entrypoint);

      if (!fragment) {
        throw new Error(`Could not find fragment for ${call.entrypoint} entrypoint in contract ABI`);
      }
      const signature = fragment.format();
  
      const inputValues = (call.calldata as RawCalldata).reduce((acc, value, index) => {
        acc[index] = value as string;
        return acc;
      }, {} as { [key: number]: string });
   
      const transactionInput : CallContractTransactionInput = {
        type: TransactionType.callContract,
        id: index.toString(),
        to: call.contractAddress,
        value: call.entrypoint === "addSheet" ? options.value.toString() : "0",
        abi: abi,
        functionSignature: signature,
        inputValues
      }
  
      const metaTransaction = encodeSingle(transactionInput);
      
      return metaTransaction;
    }));
    
    const transactions = encodeMulti(encodeTransactions, multisendContractAddress);
    const multiSendTx = ethers.utils.solidityPack(
      ["uint8", "address", "uint256", "uint256", "bytes"],
      [0, transactions.to, 0, transactions.data.length, transactions.data]
    );

    const receipt = async () => {
      const abi = await this.getAbi(multisendContractAddress);
      const contract = new Contract(multisendContractAddress, abi, signer);
      const response: ethers.providers.TransactionResponse = await contract.multiSend(multiSendTx, {
        value: options ? options.value : 0
      });
      return await response.wait();
    };

    const transactionResponse = await receipt();

    return {
      transaction_hash: transactionResponse.transactionHash
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
