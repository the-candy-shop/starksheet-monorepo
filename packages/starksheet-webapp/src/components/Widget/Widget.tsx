import { Dialog, } from "@mui/material";
import { Web3ReactProvider } from '@web3-react/core';
import { AccountInterface, WidoWidget } from 'wido-widget';
import { connect as getStarknet, StarknetWindowObject } from 'get-starknet';
import { useCallback, useEffect, useState } from 'react';
import { useWeb3React } from '@web3-react/core';
import { InjectedConnector } from '@web3-react/injected-connector';
import { providers } from 'ethers';

const ETHEREUM_ID = 1;
const STARKNET_ID = 15366;

const injected = new InjectedConnector({})

export type WidgetProps = {
  open: boolean,
  onClose: () => void
};

const WidgetDialog = ({ open, onClose }: WidgetProps) => {
  const [ethProvider, setEthProvider] = useState<providers.Web3Provider | undefined>()
  const [starknetAccount, setStarknetAccount] = useState<AccountInterface | undefined>(undefined)
  const [starknet, setStarknet] = useState<StarknetWindowObject | null>()

  const { library, activate, account, chainId } = useWeb3React()

  useEffect(() => {
    async function getStarknetAccount() {
      let starknetWindow = await getStarknet({ modalMode: "neverAsk" });
      setStarknetAccount(starknetWindow?.account)
    }

    getStarknetAccount()
  }, [starknet, setStarknetAccount])

  useEffect(() => {
    if (!library) return
    // every time account or chainId changes we need to re-create the provider
    // for the widget to update with the proper address
    setEthProvider(new providers.Web3Provider(library))
  }, [library, account, chainId, setEthProvider])

  const handleStarknet = useCallback(async () => {
    const connection = await getStarknet()
    await connection?.enable()
    setStarknet(connection)
    connection?.on('networkChanged', () => setStarknet(undefined))
    connection?.on('accountsChanged', () => setStarknet(undefined))
  }, [setStarknet])

  const handleMetamask = useCallback(async () => {
    await activate(injected)
  }, [activate])

  const handleConnectWalletClick = useCallback(
    (chainId: number) => {
      if (chainId === STARKNET_ID) {
        handleStarknet()
      } else {
        handleMetamask()
      }
    },
    [handleStarknet, handleMetamask]
  )

  const widget = <WidoWidget
    title="Bridge"
    partner="0xc8C29B5Cf0244931c08DeD3332261C7BC2d69d5C"
    ethProvider={ethProvider}
    snAccount={starknetAccount}
    width="420"
    fromTokens={[
      { chainId: ETHEREUM_ID, address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" }, // ETH
      { chainId: ETHEREUM_ID, address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" }, // USDC
      { chainId: ETHEREUM_ID, address: "0xdAC17F958D2ee523a2206206994597C13D831ec7" }, // USDT
      { chainId: ETHEREUM_ID, address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599" }, // WBTC
      { chainId: ETHEREUM_ID, address: "0x6B175474E89094C44Da98b954EedeAC495271d0F" }, // DAI
    ]}
    toTokens={[
      { chainId: STARKNET_ID, address: "0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7" }, // ETH
      { chainId: STARKNET_ID, address: "0x53c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8" }, // USDC
      { chainId: STARKNET_ID, address: "0x68f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8" }, // USDC
      { chainId: STARKNET_ID, address: "0x3fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac" }, // WBTC
      { chainId: STARKNET_ID, address: "0xda114221cb83fa859dbdb4c44beeaa0bb37c7537ad5ae66fe5e0efd20e6eb3" }, // DAI
    ]}
    onConnectWalletClick={handleConnectWalletClick}
  />

  return (
    <Dialog
      open={open}
      onClose={onClose}
      children={widget}
      style={{
        zIndex: 40, // required to allow starknet wallet selector on top of the widget
      }}
      PaperProps={{
        style: {
          backgroundColor: 'transparent',
          boxShadow: 'none',
        },
      }}
    />
  );
};

export default function Widget(props: WidgetProps) {
  return (
    <Web3ReactProvider getLibrary={(provider) => provider}>
      <WidgetDialog {...props} />
    </Web3ReactProvider>
  )
}

