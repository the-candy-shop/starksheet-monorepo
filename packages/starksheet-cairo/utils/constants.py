import logging
import os
import re
from enum import Enum
from pathlib import Path

from dotenv import load_dotenv
from starknet_py.net.full_node_client import FullNodeClient

logging.basicConfig()
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
load_dotenv()


class ChainId(Enum):
    mainnet = int.from_bytes(b"SN_MAIN", "big")
    testnet = int.from_bytes(b"SN_GOERLI", "big")
    testnet2 = int.from_bytes(b"SN_GOERLI2", "big")
    katana = int.from_bytes(b"KATANA", "big")


NETWORKS = {
    "mainnet": {
        "name": "mainnet",
        "explorer_url": "https://starkscan.co",
        "rpc_url": f"https://starknet-mainnet.infura.io/v3/{os.getenv('INFURA_KEY')}",
        "chain_id": ChainId.mainnet,
        "starknet_id_address": 0x05DBDEDC203E92749E2E746E2D40A768D966BD243DF04A6B712E222BC040A9AF,
        "starknet_id_naming": 0x06AC597F8116F886FA1C97A23FA4E08299975ECAF6B598873CA6792B9BBFB678,
    },
    "testnet": {
        "name": "testnet",
        "explorer_url": "https://testnet.starkscan.co",
        "rpc_url": f"https://starknet-goerli.infura.io/v3/{os.getenv('INFURA_KEY')}",
        "chain_id": ChainId.testnet,
        "starknet_id_address": 0x0783A9097B26EAE0586373B2CE0ED3529DDC44069D1E0FBC4F66D42B69D6850D,
        "starknet_id_naming": 0x003BAB268E932D2CECD1946F100AE67CE3DFF9FD234119EA2F6DA57D16D29FCE,
    },
    "testnet2": {
        "name": "testnet2",
        "explorer_url": "https://testnet-2.starkscan.co",
        "rpc_url": f"https://starknet-goerli2.infura.io/v3/{os.getenv('INFURA_KEY')}",
        "chain_id": ChainId.testnet2,
        "starknet_id_address": "",
        "starknet_id_naming": "",
    },
    "devnet": {
        "name": "devnet",
        "explorer_url": "",
        "rpc_url": "http://127.0.0.1:5050/rpc",
        "chain_id": ChainId.testnet,
        "starknet_id_address": 0x0783A9097B26EAE0586373B2CE0ED3529DDC44069D1E0FBC4F66D42B69D6850D,
        "starknet_id_naming": 0x003BAB268E932D2CECD1946F100AE67CE3DFF9FD234119EA2F6DA57D16D29FCE,
    },
    "docker": {
        "name": "docker",
        "explorer_url": "https://devnet.starkscan.co",
        "rpc_url": "http://127.0.0.1:5050/rpc",
        "chain_id": ChainId.testnet,
        "starknet_id_address": 0x0783A9097B26EAE0586373B2CE0ED3529DDC44069D1E0FBC4F66D42B69D6850D,
        "starknet_id_naming": 0x003BAB268E932D2CECD1946F100AE67CE3DFF9FD234119EA2F6DA57D16D29FCE,
    },
    "katana": {
        "name": "katana",
        "explorer_url": "",
        "rpc_url": "http://127.0.0.1:5050",
        "chain_id": ChainId.katana,
        "starknet_id_address": "",
        "starknet_id_naming": "",
    },
    "madara": {
        "name": "madara",
        "explorer_url": "",
        "rpc_url": "http://127.0.0.1:9944",
        "chain_id": ChainId.testnet,
        "starknet_id_address": "",
        "starknet_id_naming": "",
    },
    "sharingan": {
        "name": "sharingan",
        "explorer_url": "",
        "rpc_url": os.getenv("SHARINGAN_RPC_URL"),
        "chain_id": ChainId.testnet,
        "starknet_id_address": "",
        "starknet_id_naming": "",
    },
}

NETWORK = NETWORKS[os.getenv("STARKNET_NETWORK", "devnet")]
NETWORK["account_address"] = os.environ.get(
    f"{NETWORK['name'].upper()}_ACCOUNT_ADDRESS"
) or os.environ.get("ACCOUNT_ADDRESS")
NETWORK["private_key"] = os.environ.get(
    f"{NETWORK['name'].upper()}_PRIVATE_KEY"
) or os.environ.get("PRIVATE_KEY")
RPC_CLIENT = FullNodeClient(node_url=NETWORK["rpc_url"])

ETH_TOKEN_ADDRESS = 0x49D36570D4E46F48E99674BD3FCC84644DDD6B96F7C741B1562B82F9E004DC7
SOURCE_DIR = Path("src")
CONTRACTS = {p.stem: p for p in list(SOURCE_DIR.glob("**/*.cairo"))}
COMPILED_CONTRACTS = [
    {"contract_name": "Sheet", "is_account_contract": False},
    {"contract_name": "Starksheet", "is_account_contract": False},
    {"contract_name": "BasicCellRenderer", "is_account_contract": False},
    {"contract_name": "UriRenderer", "is_account_contract": False},
    {"contract_name": "math", "is_account_contract": False},
    {"contract_name": "execute", "is_account_contract": False},
    {"contract_name": "proxy", "is_account_contract": False},
    {"contract_name": "ERC20", "is_account_contract": False},
]

BUILD_DIR = Path("build")
BUILD_DIR.mkdir(exist_ok=True, parents=True)
DEPLOYMENTS_DIR = Path("deployments") / NETWORK["name"]
DEPLOYMENTS_DIR.mkdir(exist_ok=True, parents=True)

N_COLS = 15
N_ROWS = 15

ALLOW_LIST = []

logger.info(f"ℹ️  Using Chain id {NETWORK['chain_id'].name} with RPC {RPC_CLIENT.url}")
