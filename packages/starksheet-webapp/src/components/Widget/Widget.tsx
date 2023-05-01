import { Dialog, } from "@mui/material";
import { Web3ReactProvider } from '@web3-react/core';
import { AccountInterface, WidoWidget } from 'wido-widget';
import { getSupportedTokens } from 'wido';
import { connect as getStarknet, StarknetWindowObject } from 'get-starknet';
import { useCallback, useEffect, useState } from 'react';
import { useWeb3React } from '@web3-react/core';
import { InjectedConnector } from '@web3-react/injected-connector';
import { providers } from 'ethers';
import { ethChainId, snChainId } from '../../provider';

const injected = new InjectedConnector({})

type WidgetProps = {
  open: boolean,
  onClose: () => void
};

type TokenList = {
  chainId: number
  address: string
}[]

const WidgetDialog = ({ open, onClose }: WidgetProps) => {
  const [ethProvider, setEthProvider] = useState<providers.Web3Provider | undefined>()
  const [starknetAccount, setStarknetAccount] = useState<AccountInterface | undefined>(undefined)
  const [starknet, setStarknet] = useState<StarknetWindowObject | null>()

  const [fromTokens, setFromTokens] = useState<TokenList>([])
  const [toTokens, setToTokens] = useState<TokenList>([])

  useEffect(() => {
    getSupportedTokens({
      chainId: [ethChainId, snChainId],
    }).then((tokens) => {
      const ethereumTokens = tokens.filter(token => token.chainId === ethChainId);
      const starknetTokens = tokens.filter(token => token.chainId === snChainId);
      setFromTokens(ethereumTokens);
      setToTokens(starknetTokens);
    })
  }, [setFromTokens, setToTokens])

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
      if (chainId === snChainId) {
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
    fromTokens={fromTokens}
    toTokens={toTokens}
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

