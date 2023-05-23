# Welcome to Starksheet

Starksheet is a fully open-source fully on-chain software that aims at easing
the access of on-chain data and logic. This README focuses on a technical
description of Starksheet, for a more high-level contextual approach to
Starksheet, please refer to
[our notion page](https://starksheet.notion.site/starksheet/Starksheet-bfb55bc581e446598d7bf5860e219b03).

## What is Starksheet

From a smart contract point of view, Starksheet is a deployer contract,
deploying Sheets. A Sheet is, in turn, an NFT collection (actually a grid) of
_contract calls_ (yes, the `syscall`). These contract calls can reference others
calls like in a regular spreadsheet (or in
[the Better Multicall](https://github.com/Th0rgal/better-multicall)):

```sheet
A1=10
B1=SUM(A1, 20) // = 30
C1=SUM(A1, B1) // = 40
```

In other words, the cell `C1` uses as input the output of `A1` (the constant
value `10`) and `B1` (the sum of `A1` and `20`). If you are familiar with basic
spreadsheet operations this should look familiar.

The novelty of Starksheet is that the dapp doesn't own nor define any such `SUM`
function. Indeed, it only makes available to the user _whatever is live on
chain_. This means that for doing this simple `SUM` operation, we need instead
to know a contract that implements this function, and call it:

- say that contract at address `0x1234` defines a function called `sum`
- `sum` is called a _selector_ and has a bytes representation (either `bytes4`
  in the EVM world, or a `felt` in Starknet); say it's `0xabcd`.
- the arguments of `sum` are the _calldata_ of the call of selector `0xabcd` at
  address `0x1234`. This is either a bytes array (EVM) of a felt array
  (Starknet) of raw encoded data.

The encoding of the calldata depends on the network (EVM or Starknet) and reader
is referred to their corresponding doc for a more detailed presentation of
scheme.

## The Sheet contract

When a user creates a sheet, they indeed deploy a regular ERC721 contract with
few more features:

- the user can set the _content_ of an NFT (a cell), the content being the above
  mentioned tuple `(contract_address, selector, calldata)`
- the rendering uses the _computed value_ of the cell (ie its output value — 10,
  30 or 40 in the example above)
- the rendering of the NFT (the result of `tokenURI`) is dynamically computed on
  chain whenever one calls `tokenURI` (no static uri)

In the previous example, rendering the token `B1` would require to first render
`A1`. For the renderer to know where the calldata of `B1` was two constant
values or a constant value (`20`) and the output of another cell (`A1`), it uses
a flag being the first bit of the word (`bytes32` or `felt`):

- say A1 <> token Id #0, B1 <> token Id #1 and C1 <> token Id #2
- B1 is:
  - contract_address: 0x1234
  - selector: 0xabcde
  - calldata:
    - A1 => token Id #0 => 2 \* 0 + 1 = 1
    - 20 => constant => 2 \* 20 + 0 = 40

## The monorepo structure

This monorepo contains:

1. [The cairo contracts](./packages/starksheet-cairo/)
1. [The solidity contracts](./packages/starksheet-solidity/)
1. [The webapp](./packages/starksheet-webapp/)
1. [A toolbox webapp for non-dev](./packages/starksheet-satellites/)

The Starknet and Solidity contracts do the same things, but target either
Starknet or any EVM. The webapp is agnostic to the chain it targets (depending
on a ENV variable).
