# Starksheet Cairo

This repo contains the cairo contracts of Starksheet (+ the
[Dusty Pilots contracts](https://mintsquare.io/collection/starknet/0x00d1540fbe29acb2522694e9e3d1d776f1ab70773d33149997a65d06cc8a816f),
would need to remove them tbh 😇).

## Installation

The project uses plain python for compiling, testing and deploying the
contracts. The project uses [poetry](https://python-poetry.org/) for
dependencies management. Installation should be as straight forward as:

```bash
poetry install
```

## Tests

Being plain python means that the tests don't use any Starknet related special
things, so:

```bash
pytest .
```

## Deployment

The [deploy folder](./deploy/) contains several deployment scripts but only the
[starksheet one](./deploy/starksheet.py) is really required.

Use the ENV variable `STARKNET_NETWORK` to target a given network. By default
(nothing specified or no match), it will target the devnet (see below):

- `STARKNET_NETWORK=devnet python deploy/starksheet.py` => devnet
- `STARKNET_NETWORK=testnet python deploy/starksheet.py` => testnet
- `STARKNET_NETWORK=testnet2 python deploy/starksheet.py` => testnet2
- `STARKNET_NETWORK=mainnet python deploy/starksheet.py` => mainnet
- `STARKNET_NETWORK=mainet python deploy/starksheet.py` => devnet (see typo)
- `python deploy/starksheet.py` => devnet

This is to ensure that no heavy/costly deployment is made by mistake. We think
that the most common deployment when developing is to devnet so we fallback to
it in most of the cases.

Starting the devnet should be made with `seed 0` to ensure the deployed account
are always the same:

```bash
starknet-devnet --seed 0 --disable-rpc-request-validation
```

We also need to disable the RPC validation because the
[Starknet RPC spec](https://github.com/starkware-libs/starknet-api/tree/main/src)
is broken atm.
