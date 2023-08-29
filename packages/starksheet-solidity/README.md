# Starksheet-solidity

The EVM-compatible contracts for Starksheet (Onsheet).

## Install

The project relies on `forge`. Just have it and it should work.

## Deploy

The [Evmsheet.s.sol](./script/Evmsheet.s.sol) script deploys the starksheet
stack.

For anvil local network, just do:

```bash
anvil
```

to start anvil, and:

```bash
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 forge script script/Evmsheet.s.sol --broadcast
```

to deploy the contracts to `anvil` (default endpoint).

## Test

```bash
forge test -vv --ffi
```
