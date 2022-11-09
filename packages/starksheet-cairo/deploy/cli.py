import functools
import json
import logging
import os
import re
import subprocess
from enum import Enum
from pathlib import Path
from typing import Union

from dotenv import load_dotenv

load_dotenv()

from caseconverter import snakecase
from starknet_py.contract import Contract
from starknet_py.net import AccountClient
from starknet_py.net.gateway_client import GatewayClient
from starknet_py.net.signer.stark_curve_signer import KeyPair
from starkware.starknet.wallets.account import DEFAULT_ACCOUNT_DIR

from constants import CONTRACTS, NETWORK

logging.basicConfig()
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

network = (
    "testnet"
    if re.match(r".*(testnet|goerli)$", NETWORK, flags=re.I)
    else "testnet2"
    if re.match(r".*(testnet|goerli)-?2$", NETWORK, flags=re.I)
    else "devnet"
    if re.match(r".*(devnet|local).*", NETWORK, flags=re.I)
    else "mainnet"
)

addresses = {
    "testnet": "https://alpha4.starknet.io",
    "mainnet": "https://alpha-mainnet.starknet.io",
    "devnet": "http://127.0.0.1:5050",
    "testnet2": "https://alpha4-2.starknet.io",
}

gateway_client = GatewayClient(net=addresses[network])

starknet_network = "alpha-mainnet" if network == "mainnet" else "alpha-goerli"


class ChainId(Enum):
    mainnet = int("SN_MAIN".encode().hex(), 16)
    testnet = int("SN_GOERLI".encode().hex(), 16)
    testnet2 = int("SN_GOERLI".encode().hex(), 16)
    devnet = int("SN_GOERLI".encode().hex(), 16)


chain_id = getattr(ChainId, network)

deployments_dir = Path("deployments") / network
deployments_dir.mkdir(exist_ok=True, parents=True)

build_dir = Path("build")
build_dir.mkdir(exist_ok=True, parents=True)


def int_to_uint256(value):
    value = int(value)
    low = value & ((1 << 128) - 1)
    high = value >> 128
    return {"low": low, "high": high}


async def create_account():
    env = os.environ.copy()
    env[
        "STARKNET_WALLET"
    ] = "starkware.starknet.wallets.open_zeppelin.OpenZeppelinAccount"
    env["STARKNET_NETWORK"] = starknet_network
    output = subprocess.run(
        ["starknet", "new_account", "--account", "starksheet"],
        env=env,
        capture_output=True,
    )
    if output.returncode != 0:
        raise Exception(output.stderr.decode())
    account_address = re.search(
        r"account address: (.*)", (output.stdout.decode() + output.stderr.decode()).lower()  # type: ignore
    )[1]
    input(f"Send ETH to {account_address} and press enter to continue")
    output = subprocess.run(
        [
            "starknet",
            "deploy_account",
            "--account",
            "starksheet",
            "--gateway_url",
            f"{gateway_client.net}/gateway",
            "--feeder_gateway_url",
            f"{gateway_client.net}/feeder_gateway",
        ],
        env=env,
        capture_output=True,
    )
    if output.returncode != 0:
        raise Exception(output.stderr.decode())
    transaction_hash = re.search(
        r"transaction hash: (.*)", (output.stdout.decode() + output.stderr.decode()).lower()  # type: ignore
    )[1]
    await gateway_client.wait_for_tx(transaction_hash)


def get_account() -> AccountClient:
    if network == "devnet":
        # Hard-coded values when running starknet-devnet with seed = 0
        return AccountClient(
            address="0x7e00d496e324876bbc8531f2d9a82bf154d1a04a50218ee74cdd372f75a551a",
            client=gateway_client,
            supported_tx_version=1,
            chain=chain_id,  # type: ignore
            key_pair=KeyPair(
                private_key=int("0xe3e70682c2094cac629f6fbed82c07cd", 16),
                public_key=int(
                    "0x7e52885445756b313ea16849145363ccb73fb4ab0440dbac333cf9d13de82b9",
                    16,
                ),
            ),
        )

    accounts = json.load(
        open(list(Path(DEFAULT_ACCOUNT_DIR).expanduser().glob("*.json"))[0])
    )
    account = accounts.get(starknet_network, {}).get("starksheet")
    if account is None:
        raise ValueError(
            f"No account found for network {network} (KeyError: {starknet_network})"
        )

    return AccountClient(
        address=account["address"],
        client=gateway_client,
        supported_tx_version=1,
        chain=chain_id,  # type: ignore
        key_pair=KeyPair(
            private_key=int(account["private_key"], 16),
            public_key=int(account["public_key"], 16),
        ),
    )


def get_argent_account() -> AccountClient:
    return AccountClient(
        address="0x01C8d2Bb17cdDf22728553c9700ADfBBD42D1999194b409B1188b17191Cc2Efd",
        client=gateway_client,
        supported_tx_version=0,
        chain=chain_id,  # type: ignore
        key_pair=KeyPair.from_private_key(int(os.environ["ARGENT_X_PRIVATE_KEY"])),
    )


async def get_eth_contract(account) -> Contract:
    return await Contract.from_address(
        "0x62230ea046a9a5fbc261ac77d03c8d41e5d442db2284587570ab46455fd2488",
        account,
    )


async def fund_address(address: Union[int, str], amount: int):
    address = int(address, 16) if isinstance(address, str) else address
    account = get_account()
    eth_contract = await get_eth_contract(account)
    balance = (await eth_contract.functions["balanceOf"].call(account.address)).balance  # type: ignore
    if balance / 1e18 < amount:
        raise ValueError(
            f"Cannot send {amount} ETH from default account with current balance {balance / 1e18} ETH"
        )
    tx = await eth_contract.functions["transfer"].invoke(
        address, int_to_uint256(amount * 1e18), max_fee=int(1e16)
    )
    await tx.wait_for_acceptance()
    logger.info(f"{amount} ETH sent from {hex(account.address)} to {address}")


def dump_declarations(declarations):
    json.dump(
        {name: hex(class_hash) for name, class_hash in declarations.items()},
        open(deployments_dir / "declarations.json", "w"),
        indent=2,
    )


def get_declarations():
    return {
        name: int(class_hash, 16)
        for name, class_hash in json.load(
            open(deployments_dir / "declarations.json")
        ).items()
    }


def dump_deployments(deployments):
    json.dump(
        {
            name: {
                **deployment,
                "address": hex(deployment["address"]),
                "tx": hex(deployment["tx"]),
                "artifact": str(deployment["artifact"]),
            }
            for name, deployment in deployments.items()
        },
        open(deployments_dir / "deployments.json", "w"),
        indent=2,
    )


def get_deployments():
    return json.load(open(deployments_dir / "deployments.json", "r"))


def get_artifact(contract_name):
    return build_dir / f"{contract_name}.json"


def get_alias(contract_name):
    return snakecase(contract_name)


def compile_contract(contract_name):
    contract_file = CONTRACTS.get(contract_name)
    if contract_file is None:
        raise ValueError(
            f"Cannot find contracts/**/{contract_name}.cairo in {os.getcwd()}"
        )
    output = subprocess.run(
        [
            "starknet-compile",
            contract_file,
            "--output",
            build_dir / f"{contract_name}.json",
            *(["--disable_hint_validation"] if network == "devnet" else []),
        ],
        capture_output=True,
    )
    if output.returncode != 0:
        raise RuntimeError(output.stderr)


async def declare(contract_name):
    logger.info(f"Declaring {contract_name}")
    account = get_account()
    artifact = get_artifact(contract_name)
    declare_transaction = await account.sign_declare_transaction(
        compiled_contract=Path(artifact).read_text(), max_fee=int(1e16)
    )
    resp = await account.declare(transaction=declare_transaction)
    await account.wait_for_tx(resp.transaction_hash)
    return resp.class_hash


async def deploy(contract_name, *args):
    logger.info(f"Deploying {contract_name}")
    account = get_account()
    artifact = get_artifact(contract_name)
    deploy_result = await Contract.deploy(
        client=account,
        compiled_contract=Path(artifact).read_text(),
        constructor_args=list(args),
    )
    await deploy_result.wait_for_acceptance()
    logger.info(
        f"{contract_name} deployed at: %s", hex(deploy_result.deployed_contract.address)
    )
    return deploy_result.deployed_contract.address, deploy_result.hash


async def invoke(contract_name, function_name, *inputs, address=None):
    account = get_account()
    deployments = get_deployments()
    contract = Contract(
        deployments[contract_name]["address"] if address is None else address,
        json.load(open(get_artifact(contract_name)))["abi"],
        account,
    )
    call = contract.functions[function_name].prepare(*inputs, max_fee=int(1e16))
    logger.info(f"Invoking {contract_name}.{function_name}({call.arguments})")
    response = await account.execute(call, max_fee=int(1e16))
    logger.info(
        f"{contract_name}.{function_name} invoked at tx: %s",
        hex(response.transaction_hash),
    )
    await account.wait_for_tx(response.transaction_hash)
    return response.transaction_hash


async def call(contract_name, function_name, *inputs, address=None):
    deployments = get_deployments()
    account = get_account()
    contract = Contract(
        deployments[contract_name]["address"] if address is None else address,
        json.load(open(get_artifact(contract_name)))["abi"],
        account,
    )
    return await contract.functions[function_name].call(*inputs)


@functools.wraps(gateway_client.wait_for_tx)
async def wait_for_transaction(*args, **kwargs):
    return await gateway_client.wait_for_tx(*args, **kwargs)
