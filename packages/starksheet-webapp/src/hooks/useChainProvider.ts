import { useContext } from "react";
import { ChainProviderContext } from "../contexts/ChainProviderContext";
import { ChainProvider } from "../types";

/**
 * The useChainProvider hook.
 *
 * This hook is a wrapper around fetching the actual chainProvider from the React context.
 */
export function useChainProvider(): ChainProvider {
  return useContext(ChainProviderContext)
}
