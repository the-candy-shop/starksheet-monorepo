import { useEffect, useState } from "react";
import { ChainId, ChainProvider, ChainType } from "../types";
import { chainImplementations, getChainConfigById } from "../provider/chains";

export function useChainProvider() {
  const [provider, setProvider] = useState<ChainProvider>();

  // try to get the RPC from an environment variable
  const rpcUrl = process.env.REACT_APP_RPC_PROVIDER;
  if (!rpcUrl) {
    throw new Error('a valid RPC must be provided through the REACT_APP_RPC_PROVIDER environment variable');
  }

  // this effect creates a chain provider for the environment rpc provider
  useEffect(() => {
    getChainInfoFromRpc(rpcUrl).then(([chainId, chainType]) => {
      // get the config matching the chain id
      const config = getChainConfigById(chainId);
      // create a chain provider instance matching the given config for the given chain type
      const instance = chainImplementations[chainType].build(rpcUrl, config)
      // set the built instance as the hook chain provider
      setProvider(instance);
    })
  }, [setProvider, rpcUrl]);


  return provider!;
}

/**
 * Gets the current chain info.
 */
async function getChainInfoFromRpc(rpcUrl: string): Promise<[ChainId, ChainType]> {


  // try to get the chain id from a starknet call
  const starknetCallResult = await fetchRpcMethod(rpcUrl, 'starknet_chainId');
  const starknetChainId = starknetCallResult.result;
  if (starknetChainId) {
    console.log(starknetChainId);
    return [starknetChainId, ChainType.STARKNET];
  }

  // try to get the chain id from a eth call
  const ethCallResult = await fetchRpcMethod(rpcUrl, 'eth_chainId');
  const ethChainId = ethCallResult.result;
  if (ethChainId) {
    return [ethChainId, ChainType.EVM];
  }

  throw new Error(`could not find chain id for the given rpc (${rpcUrl}), is the rpc starknet or evm compatible?`);
}

/**
 * Fetches a rpc method.
 */
async function fetchRpcMethod(rpc: string, method: 'eth_chainId' | 'starknet_chainId') {
  return fetch(rpc, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      id: 1,
      jsonrpc: "2.0",
      method,
    }),
  })
    .then((response) => response.json())
}
