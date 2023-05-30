import { JsonRpcProvider } from "@ethersproject/providers";
import { Contract } from "ethers";
import { ABI, ChainProvider, ChainConfig, ChainId, ChainType, ContractCall, TransactionReceipt } from "../types";

/**
 * Represents an EVM-compatible implementation of the chain provider.
 */
export class EVMProvider implements ChainProvider {
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
  async callContract<T = string>(options: ContractCall): Promise<T> {
    const abi = await this.getAbi(options.contractAddress);
    const contract = new Contract(options.contractAddress, abi, this.provider);

    return contract[options.entrypoint](...options.calldata);
  }

  /**
   * @inheritDoc
   */
  async getAbi(address: string): Promise<ABI> {
    // build the query parameters
    const params = new URLSearchParams({
      action: "getabi",
      address,
      apikey: process.env.EXPLORER_KEY || "",
      module: "contract",
    });
    // build the query url
    const url = new URL("https://api-goerli.etherscan.io/api", "");
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
    // parse the raw abi and return it
    return JSON.parse(rawAbi);
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
  getTransactionReceipt(hash: string): Promise<TransactionReceipt> {
    return this.provider.getTransactionReceipt(hash);
  }

  /**
   * @inheritDoc
   */
  async waitForTransaction(hash: string): Promise<void> {
    const transaction = await this.provider.getTransaction(hash);
    await transaction.wait();
  }
}
