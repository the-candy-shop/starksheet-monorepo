import json
import logging
import os
import re
import subprocess

from caseconverter import snakecase
from starknet_py.contract import Contract
from starknet_py.net import AccountClient, networks
from starknet_py.net.gateway_client import GatewayClient
from starknet_py.net.models import StarknetChainId
from starknet_py.net.signer.stark_curve_signer import KeyPair

from constants import ACCOUNTS, NETWORK

logging.basicConfig()
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

network = (
    "TESTNET" if re.match(r".*(testnet|goerli).*", NETWORK, flags=re.I) else "MAINNET"
)

client = AccountClient(
    address=ACCOUNTS["starksheet"]["address"],
    client=GatewayClient(net=getattr(networks, network)),
    chain=getattr(StarknetChainId, network),
    key_pair=KeyPair(
        private_key=int(ACCOUNTS["starksheet"]["private_key"], 16),
        public_key=int(ACCOUNTS["starksheet"]["public_key"], 16),
    ),
)


def dump_declarations(declarations):
    json.dump(declarations, open(f"{client.net}.declarations.json", "w"), indent=2)


def get_declarations(network):
    return json.load(open(f"{network}.declarations.json"))


def dump_deployments(deployments):
    json.dump(deployments, open(f"{client.net}.deployments.json", "w"), indent=2)


def get_deployments(network):
    return json.load(open(f"{network}.deployments.json"))


def get_artifact(contract_name):
    return f"build/{contract_name}.json"


def get_alias(contract_name):
    return snakecase(contract_name)


def get_abis(contract_name):
    return f"build/{contract_name}_abi.json"


def declare(contract_name):
    logger.info(f"Declaring {contract_name}")
    env = os.environ.copy()
    env["ACCOUNT_PRIVATE_KEY"] = ACCOUNTS["starksheet"]["private_key"]
    output = subprocess.run(
        [
            "protostar",
            "declare",
            get_artifact(contract_name),
            "--network",
            f"{client.net}",
            "--account-address",
            ACCOUNTS["starksheet"]["address"],
        ]
        + (
            ["--token", os.environ["STARKNET_TOKEN"]] if client.net == "mainnet" else []
        ),
        capture_output=True,
        env=env,
    )
    if output.returncode != 0:
        raise Exception(output.stderr.decode())
    class_hash = re.search(
        r"class hash: (.*)", (output.stdout.decode() + output.stderr.decode()).lower()  # type: ignore
    )[1]
    logger.info(f"{contract_name} declared with class hash: %s", class_hash)
    return class_hash


def deploy(contract_name, *args):
    logger.info(f"Deploying {contract_name}")
    cmd = (
        [
            "protostar",
            "deploy",
            get_artifact(contract_name),
            "--network",
            f"{client.net}",
        ]
        + ((["--inputs"] + list(args)) if args else [])
        + (["--token", os.environ["STARKNET_TOKEN"]] if NETWORK == "mainnet" else [])
    )
    output = subprocess.run(cmd, capture_output=True)
    if output.returncode != 0:
        raise Exception(output.stderr.decode())
    address = re.search(
        r"contract address: (.*)", (output.stdout.decode() + output.stderr.decode()).lower()  # type: ignore
    )[1]
    transaction_hash = re.search(
        r"transaction hash: (.*)", (output.stdout.decode() + output.stderr.decode()).lower()  # type: ignore
    )[1]
    logger.info(f"{contract_name} deployed at: %s", address)
    return address, transaction_hash


def wait_for_transaction(transaction_hash):
    cmd = [
        "starknet",
        "tx_status",
        "--network",
        f"{client.net}",
        "--hash",
        transaction_hash,
    ]
    output = subprocess.run(cmd, capture_output=True)
    if output.returncode != 0:
        raise Exception(output.stderr.decode())
    status = json.loads(output.stdout.decode())["tx_status"]
    logger.info(f"Transaction {transaction_hash} status: {status}")
    while status in ["NOT_RECEIVED", "RECEIVED"]:
        try:
            output = subprocess.run(cmd, capture_output=True)
            status = json.loads(output.stdout.decode())["tx_status"]
            logger.info(f"Transaction {transaction_hash} status: {status}")
        except json.decoder.JSONDecodeError as e:
            logger.info(f"Failed to decode transaction status: {e.msg}")
    if status == "REJECTED":
        logger.warning(f"Transaction {transaction_hash} rejected")


async def invoke(contract_name, function_name, *inputs, address=None):
    deployments = get_deployments(client.net)
    contract = Contract(
        deployments[contract_name]["address"] if address is None else address,
        json.load(open(get_abis(contract_name))),
        client,
    )
    call = contract.functions[function_name].prepare(*inputs, max_fee=int(1e16))
    logger.info(f"Invoking {contract_name}.{function_name}({call.arguments})")
    response = await client.execute(call, max_fee=int(1e16))
    logger.info(
        f"{contract_name}.{function_name} invoked at tx: %s",
        hex(response.transaction_hash),
    )
    await client.wait_for_tx(response.transaction_hash)
    return response.transaction_hash


async def call(contract_name, function_name, *inputs, address=None):
    deployments = get_deployments(client.net)
    contract = Contract(
        deployments[contract_name]["address"] if address is None else address,
        json.load(open(get_abis(contract_name))),
        client,
    )
    return await contract.functions[function_name].call(*inputs)
