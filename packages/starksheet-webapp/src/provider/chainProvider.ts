export interface ChainProvider {
  getAbi(address: string): Promise<any>;
  callContract(options: {
    contractAddress: string;
    entrypoint: string;
    calldata: any;
  }): Promise<any>;
  waitForTransaction(hash: string): Promise<any>;
  getTransactionReceipt(hash: string): Promise<any>;
}
