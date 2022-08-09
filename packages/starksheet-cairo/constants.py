import json
import os
from pathlib import Path

from dotenv import load_dotenv
from starkware.starknet.wallets.account import DEFAULT_ACCOUNT_DIR

load_dotenv()

NETWORK = os.getenv("STARKNET_NETWORK", "alpha-goerli")
CONTRACTS = {p.stem: p for p in list(Path("contracts").glob("**/*.cairo"))}

accounts = {
    key: value["address"]
    for key, value in json.load(
        open(list(Path(DEFAULT_ACCOUNT_DIR).expanduser().glob("*.json"))[0])
    )[NETWORK].items()
}

OWNER = int(accounts["starksheet"], 16)
N_COLS = 15
N_ROWS = 15

ALLOW_LIST = [
    OWNER,
    int("0x02a1eC511Dbced8D34997fbaDfcB72e173910CA00901ee123eEf6a0548EC5E66", 16),
    int("0x458e8922dbe02db12182e2b3b7374cd51054cb11b442df96f79f07d02d7a7e3", 16),
    int("0x00140440374ca75f0732670014042D2645F637356A34d16c2F44955ea7941d3D", 16),
]
