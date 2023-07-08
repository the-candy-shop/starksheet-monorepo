import BN from "bn.js";
import { BigNumberish } from "ethers";
import { disconnect, connect as getStarknet } from "get-starknet";
import {
  Abi,
  Provider,
  ProviderInterface,
  RpcProvider,
  hash,
  number,
  stark,
} from "starknet";
import {
  StarknetSpreadsheetContract,
  StarknetWorksheetContract,
} from "../contracts";
import {
  ChainConfig,
  ChainId,
  ChainProvider,
  ChainType,
  ContractAbi,
  ContractCall,
  TransactionResponse,
  WorksheetContract,
} from "../types";
import { RC_BOUND } from "../utils/constants";
import { bn2hex, hex2str, normalizeHexString } from "../utils/hexUtils";
import { chainAbi } from "./chains";

export class StarknetProvider implements ChainProvider {
  private readonly provider: ProviderInterface;
  private readonly spreadsheetContract: StarknetSpreadsheetContract;

  /**
   * Constructs a StarknetProvider.
   */
  constructor(rpcUrl: string, private config: ChainConfig) {
    this.provider = config.gateway
      ? new Provider({ sequencer: { network: config.gateway } })
      : new RpcProvider({
          nodeUrl: rpcUrl,
        });

    const address = config.addresses.spreadsheet;
    const abi = chainAbi.spreadsheet;
    this.spreadsheetContract = new StarknetSpreadsheetContract(
      address,
      abi,
      this.provider
    );
  }

  async addressAlreadyDeployed(address: string) {
    try {
      await this.provider.getClassAt(address, "latest");
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Builds a starknet provider for the given rpc and config.
   */
  public static build(rpcUrl: string, config: ChainConfig): StarknetProvider {
    return new StarknetProvider(rpcUrl, config);
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
    const abi = chainAbi.worksheet;
    return new StarknetWorksheetContract(address, abi, this.provider);
  }

  /**
   * @inheritDoc
   */
  waitForTransaction(hash: string): Promise<any> {
    return this.provider.waitForTransaction(hash, 3_000);
  }

  /**
   * @inheritDoc
   */
  getTransactionReceipt(hash: string): Promise<any> {
    return this.provider.getTransactionReceipt(hash);
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
      response = await this.provider.getClassAt(address);
    } catch (error) {
      response = { abi: [] };
    }

    abi = response.abi || abi;
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
              const implementationAddress = await this.provider.callContract({
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

  parseAbi = (abi: Abi): ContractAbi =>
    (!!abi.length ? abi : []).reduce(
      (prev, cur) => ({
        ...prev,
        [hash.getSelectorFromName(cur.name)]: cur,
      }),
      {}
    );

  /**
   * @inheritDoc
   */
  async callContract(call: ContractCall): Promise<string> {
    const response = await this.provider.callContract(
      {
        contractAddress: call.to,
        entrypoint: call.entrypoint,
        calldata: (call.calldata as BN[]).map((c) => bn2hex(c)),
      },
      "latest"
    );
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
      throw new Error(
        "Cannot find a starknet window, is ArgentX or Braavos installed?"
      );
    }

    if (!starknetWindow.isConnected) {
      throw new Error("Login failed");
    }

    if (
      (this.config.chainId as string) !==
      (starknetWindow.provider.chainId as string)
    ) {
      if (starknetWindow.id === "argentX") {
        await starknetWindow.request({
          type: "wallet_switchStarknetChain",
          params: { chainId: this.config.chainId },
        });
      } else {
        throw new Error(
          `Wrong network detected: "${hex2str(
            starknetWindow.provider.chainId
          )}" instead of "${this.config.chainId}"`
        );
      }
    }

    return normalizeHexString(starknetWindow.account.address);
  }

  /**
   * @inheritDoc
   */
  async execute(
    calls: ContractCall[],
    options?: { value?: BigNumberish }
  ): Promise<TransactionResponse> {
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
          to: "0x49D36570D4E46F48E99674BD3FCC84644DDD6B96F7C741B1562B82F9E004DC7",
          entrypoint: "approve",
          calldata: stark.compileCalldata({
            spender: calls[0].to,
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

    return await starknetWindow.account.execute(
      calls.map((call) => ({
        contractAddress: call.to,
        entrypoint: call.entrypoint,
        calldata: call.calldata as BN[],
      }))
    );
  }
}
