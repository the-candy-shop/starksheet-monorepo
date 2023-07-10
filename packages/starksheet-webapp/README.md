# Onsheet webapp

This is the onsheet webapp as deployed for example for Starknet at
[app.starksheet.xyz](app.starksheet.xyz).

## Installation

```bash
npm install
```

## Tests

No tests 😰

## Run

When developing the web app, it's possible to target any networks (devnet,
testnet and mainnet). It's not because you work on the FE that you have to run a
devnet. Depending on your need, it may be enough to target the testnet or even
the mainnet for final testing.

The ENV variable `REACT_APP_NETWORK` is used to select the target network. By
default (not set), it will target the starknet-devnet, see
[Starksheet cairo README](../starksheet-cairo/README.md#deployment).

The app will automatically uses the latest deployments made in
[starksheet-cairo](../starksheet-cairo/deployments/) or in
[starksheet-solidity](../starksheet-solidity/broadcast/Evmsheet.s.sol/) so you
just need to provide the ENV variable:

- `REACT_APP_NETWORK=devnet npm start` => use local devnet (Starknet)
- `npm start` => use local devnet (Starknet)
- `REACT_APP_NETWORK=testnet npm start` => use testnet (Starknet)
- `REACT_APP_NETWORK=testnet2 npm start` => use testnet2 (Starknet)
- `REACT_APP_NETWORK=mainnet npm start` => use mainnet (Starknet)
- `REACT_APP_NETWORK=anvil npm start` => use anvil (EVM)
- `REACT_APP_NETWORK=goerli npm start` => use goerli (EVM)

Note: when using the devnet or anvil, you need to **first** start the devnet and
run either:

for starknet-devnet:

```bash
python deploy/starksheet.py
```

for anvil:

```bash
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 forge script script/Evmsheet.s.sol --broadcast --rpc-url http://127.0.0.1:8545
```

and **then** run `REACT_APP_NETWORK={devnet/anvil} npm start`.

## Architecture

The app (too ?) heavily relies on
[React contexts](https://react.dev/reference/react/useContext) to store data and
manage the state. To give a smooth UX, the app indeed caches every on-chain data
that it uses (note: a wss should be used to listen to new events).

### Contexts

#### AbisContext

This context stores all the ABIs already retrieved and help fetching new ABIs
when required.

While it's not strictly necessary for Starksheet to access these ABIs (it's not
require to know the ABI to make a contract call), pulling the ABIs lets display
to the user what is actually available at a given input address, and the
expected inputs of a function.

#### AccountContext

This context is responsible for managing everything related to the connect
account (user). To make the mutlicall feature chain agnostic, the
`AccountContext` is responsible for making the "Save" multicall.

#### AppStatus

This is probably a hack because I didn't know any lib nor how to make this
properly. It is basically a place to write state of given part of the app
(loading or loaded sheet, error message, etc.).

#### CellValuesContext

This is THE place where everything is stored, and consequently quite messy.
Basically, the app can open several sheets and each sheet has its own data.
During the a session, a user starts from an initial state (fetch from the chain)
and makes update.

When they save, they send a multicall to _publish_ all their diff to the chain.
In the meantime, the app displays the data considering the updated state: when
you update a cell, you need to "Save" to see it's new value on the app.

In other words, one could say that the FE acts as a local L3/Buffer and when the
user "Save", it commits to L2 (where the Sheet contract is actually deployed).

#### OnsheetContext

This context manages the list of opened sheet. Worth noticing is the fact that
when a user creates a sheet (with +), the sheet is directly available for
edition while it's not deployed already.

To have the final "Save" multicall working in this context requires to know in
advance what will be the address of each deployed sheet.

#### TransactionContext

This context stores the transactions to be made when the user clicks on "Save".
