import { Abi, RpcProvider, SequencerProvider, number, Call, stark } from "starknet";
import { RC_BOUND } from "../utils/constants";
import { hex2str, normalizeHexString } from "../utils/hexUtils";
import {
  ChainConfig,
  ChainId,
  ChainProvider,
  ChainType,
  ContractCall,
  TransactionResponse,
  WorksheetContract
} from '../types';
import { StarknetSpreadsheetContract, StarknetWorksheetContract } from "../contracts";
import { chainAbi } from "./chains";
import { connect as getStarknet, disconnect } from "get-starknet";
import { chainId } from "./index";
import { BigNumberish } from "ethers";

export class StarknetProvider implements ChainProvider {
  private readonly rpcProvider: RpcProvider;
  private readonly spreadsheetContract: StarknetSpreadsheetContract;
  private sequencerProvider: SequencerProvider;
  private chainId: string;

  /**
   * Constructs a StarknetProvider.
   */
  constructor(rpcUrl: string, sequencerUrl: string, private config: ChainConfig) {
    this.sequencerProvider = new SequencerProvider({
      baseUrl: sequencerUrl,
    });

    this.rpcProvider = new RpcProvider({
      nodeUrl: rpcUrl,
    });

    this.chainId = "";
    this.rpcProvider.getChainId().then((id) => (this.chainId = hex2str(id)));

    const address = config.addresses.spreadsheet;
    const abi = chainAbi[this.config.chainType].spreadsheet;
    this.spreadsheetContract = new StarknetSpreadsheetContract(address, abi, this.rpcProvider);
  }

  /**
   * Builds a starknet provider for the given rpc and config.
   */
  public static build(rpcUrl: string, config: ChainConfig): StarknetProvider {
    return new StarknetProvider(rpcUrl, config.sequencerUrl!, config);
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
  getExplorerAddress(contractAddress: string) {
    return `${this.config.explorerBaseUrl}${contractAddress}`;
  }

  /**
   * @inheritDoc
   */
  getNftMarketplaceAddress(contractAddress: string) {
    return `${this.config.nftBaseUrl}${contractAddress}`;
  }

  /**
   * @inheritDoc
   */
  getSpreadsheetContract(): StarknetSpreadsheetContract {
    return this.spreadsheetContract;
  }

  /**
   * @inheritDoc
   */
  getWorksheetContractByAddress(address: string): WorksheetContract {
    const abi = chainAbi[this.config.chainType].worksheet;
    return new StarknetWorksheetContract(address, abi, this.rpcProvider);
  }

  /**
   * @inheritDoc
   */
  waitForTransaction(hash: string): Promise<any> {
    return this.rpcProvider.waitForTransaction(hash, 50_000);
  }

  /**
   * @inheritDoc
   */
  getTransactionReceipt(hash: string): Promise<any> {
    return this.rpcProvider.getTransactionReceipt(hash);
  }

  /**
   * @inheritDoc
   */
  async getAbi(address: string): Promise<any> {
    let abi: Abi = [];
    if (number.toBN(address).eq(RC_BOUND)) {
      return abi;
    }

    let response;
    try {
      response = await this.sequencerProvider.getClassAt(address);
    } catch (error) {
      try {
        // @ts-ignore
        response = await this.sequencerProvider.fetchEndpoint(
          "get_class_by_hash",
          {
            classHash: address,
          }
        );
      } catch (error) {}
    }

    abi = response?.abi || abi;
    return [
      ...abi,
      ...(
        await Promise.all(
          abi
            .filter(
              (f) =>
                f.name.includes("impl") &&
                f.type === "function" &&
                f.stateMutability === "view" &&
                f.inputs.length === 0
            )
            .map(async (f) => {
              const implementationAddress =
                await this.sequencerProvider.callContract({
                  contractAddress: address,
                  entrypoint: f.name,
                });
              return Object.values(
                (await this.getAbi(implementationAddress.result[0])) || {}
              ) as Abi;
            })
        )
      ).flat(),
    ];
  }

  /**
   * @inheritDoc
   */
  async callContract(call: ContractCall): Promise<string> {
    const response = await this.rpcProvider.callContract(call, "latest");
    return response.result[0];
  }

  /**
   * @inheritDoc
   */
  async login(): Promise<string> {
    let starknetWindow = await getStarknet({ modalMode: "neverAsk" });

    if (starknetWindow?.isConnected) {
      await disconnect({ clearLastWallet: true });
    }

    starknetWindow = await getStarknet({ modalMode: "canAsk" });
    if (starknetWindow === null) {
      throw new Error("Cannot find a starknet window, is ArgentX or Braavos installed?");
    }

    if (!starknetWindow.isConnected) {
      throw new Error("Login failed");
    }

    if (chainId !== hex2str(starknetWindow.provider.chainId)) {
      if (starknetWindow.id === "argentX") {
        await starknetWindow.request({
          type: "wallet_switchStarknetChain",
          params: { chainId },
        });
      } else {
        throw new Error(`Wrong network detected: "${hex2str(
          starknetWindow.provider.chainId
        )}" instead of "${chainId}"`)
      }
    }

    return (normalizeHexString(starknetWindow.account.address));
  }

  /**
   * @inheritDoc
   */
  async execute(calls: Call[], options?: { value?: BigNumberish }): Promise<TransactionResponse> {
    const starknetWindow = await getStarknet({ modalMode: "neverAsk" });
    if (starknetWindow === null) {
      throw new Error("Account is not connected");
    }
    if (!starknetWindow.isConnected) {
      throw new Error("Account is not connected");
    }
    if (options?.value) {
      calls = [
        {
          contractAddress:
            "0x49D36570D4E46F48E99674BD3FCC84644DDD6B96F7C741B1562B82F9E004DC7",
          entrypoint: "approve",
          calldata: stark.compileCalldata({
            spender: calls[0].contractAddress,
            amount: {
              type: "struct",
              low: number.toBN(options.value.toString()),
              high: 0,
            },
          }),
        },
        ...calls,
      ];
    }

    return await starknetWindow.account.execute(calls);
  }
}
