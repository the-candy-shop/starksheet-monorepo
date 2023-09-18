import {
  StarknetWindowObject,
  connect,
  disconnect,
} from "@argent/get-starknet";
import {
  Abi,
  BigNumberish,
  CallData,
  RpcProvider,
  TransactionFinalityStatus,
  hash,
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
import { bigint2hex, hex2str, normalizeHexString } from "../utils/hexUtils";
import { chainAbi } from "./chains";

export class StarknetProvider implements ChainProvider {
  private readonly provider: RpcProvider;
  private readonly spreadsheetContract: StarknetSpreadsheetContract;
  private connection: StarknetWindowObject | undefined;

  /**
   * Constructs a StarknetProvider.
   */
  constructor(rpcUrl: string, private config: ChainConfig) {
    this.provider = new RpcProvider({
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

  async getContractType(address: string) {
    try {
      const classAt = await this.provider.getClassAt(address, "latest");
      return Object.hasOwn(classAt, "sierra_program") ? 1 : 0;
    } catch (error) {
      return undefined;
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

  sleep = (delay: number) =>
    new Promise((resolve) => setTimeout(resolve, delay * 1_000));

  /**
   * @inheritDoc
   */
  async waitForTransaction(hash: string): Promise<any> {
    for (let i = 0; i < 10; i++) {
      try {
        return await this.provider.getTransactionReceipt(hash);
      } catch (e) {
        await this.sleep(3);
      }
    }
    return this.provider.waitForTransaction(hash, {
      successStates: [TransactionFinalityStatus.ACCEPTED_ON_L2],
    });
  }

  /**
   * @inheritDoc
   */
  async getTransactionReceipt(hash: string): Promise<any> {
    const receipt = await this.provider.getTransactionReceipt(hash);
    return { ...receipt, status: receipt.finality_status };
  }

  /**
   * @inheritDoc
   */
  async getAbi(address: string): Promise<any> {
    let abi: Abi = [];
    if (BigInt(address) === RC_BOUND) {
      return abi;
    }

    let contractType = await this.getContractType(address);
    let response;
    try {
      if (contractType !== undefined) {
        response = await this.provider.getClassAt(address);
      } else {
        response = await this.provider.getClassByHash(address);
      }
    } catch (error) {
      response = { abi: [] };
    }

    abi = response.abi || abi;
    if (contractType === 1) {
      abi = abi
        .filter((item) => item.type === "interface")
        .map((item) => item.items)
        .flat();
    }
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
      ).flat(3),
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
        calldata: (call.calldata as bigint[]).map((c) => bigint2hex(c)),
      },
      "latest"
    );
    return response.result[0];
  }

  /**
   * @inheritDoc
   */
  async login(): Promise<string> {
    if (this.connection?.isConnected) {
      await disconnect({ clearLastWallet: true });
    }

    const connection = await connect({
      modalMode: "alwaysAsk",
      dappName: this.config.appName,
      webWalletUrl:
        this.config.chainId === ChainId.STARKNET_MAINNET
          ? "https://web.argent.xyz"
          : "https://web.hydrogen.argent47.net",
    });

    if (connection === null) {
      return "";
    }

    if (!connection.isConnected) {
      throw new Error("Login failed");
    }

    if (
      (this.config.chainId as string) !==
      (connection.provider.chainId as string)
    ) {
      if (connection.id === "argentX") {
        await connection.request({
          type: "wallet_switchStarknetChain",
          params: { chainId: this.config.chainId },
        });
      } else {
        if (connection.provider.chainId !== undefined) {
          throw new Error(
            `Wrong network detected: "${hex2str(
              connection.provider.chainId
            )}" instead of "${hex2str(this.config.chainId)}"`
          );
        }
      }
    }

    this.connection = connection;
    return normalizeHexString(connection.account.address);
  }

  /**
   * @inheritDoc
   */
  async execute(
    calls: ContractCall[],
    options?: { value?: BigNumberish }
  ): Promise<TransactionResponse> {
    if (!this.connection?.isConnected) {
      throw new Error("Account is not connected");
    }

    if (options?.value) {
      calls = [
        {
          to: "0x49D36570D4E46F48E99674BD3FCC84644DDD6B96F7C741B1562B82F9E004DC7",
          entrypoint: "approve",
          calldata: CallData.compile({
            spender: calls[0].to,
            amount: {
              low: options.value.toString(),
              high: 0,
            },
          }),
        },
        ...calls,
      ];
    }
    console.log(this.connection);
    console.log(this.connection.account);
    console.log(
      calls.map((call) => ({
        contractAddress: call.to,
        entrypoint: call.entrypoint,
        calldata: [...call.calldata],
      }))
    );
    return await this.connection.account.execute(
      calls.map((call) => ({
        contractAddress: call.to,
        entrypoint: call.entrypoint,
        calldata: [...call.calldata],
      }))
    );
  }
}
