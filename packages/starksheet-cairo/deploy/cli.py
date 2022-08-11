import json
import logging
import os
import re
import subprocess

from caseconverter import snakecase

from constants import NETWORK

logging.basicConfig()
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


def get_deployments(network):
    return json.load(open(f"{network}.deployments.json"))


def get_artifact(contract_name):
    return f"artifacts/{contract_name}.json"


def get_alias(contract_name):
    return snakecase(contract_name)


def get_abis(contract_name):
    return f"artifacts/abis/{contract_name}.json"


def declare(contract_name, network=NETWORK):
    logger.info(f"Declaring {contract_name}")
    output = subprocess.run(
        [
            "starknet",
            "declare",
            "--contract",
            get_artifact(contract_name),
            "--network",
            f"{network}",
        ]
        + (
            ["--token", os.environ["STARKNET_TOKEN"]]
            if NETWORK == "alpha-mainnet"
            else []
        ),
        capture_output=True,
    )
    if output.returncode != 0:
        raise Exception(output.stderr.decode())
    class_hash = re.search(
        r"contract class hash: (.*)", output.stdout.decode().lower()  # type: ignore
    )[1]
    logger.info(f"{contract_name} declared with class hash: %s", class_hash)
    return class_hash


def deploy(contract_name, *args, network=NETWORK):
    logger.info(f"Deploying {contract_name}")
    cmd = (
        [
            "starknet",
            "deploy",
            "--contract",
            get_artifact(contract_name),
            "--network",
            f"{network}",
            "--no_wallet",
        ]
        + ((["--inputs"] + list(args)) if args else [])
        + (
            ["--token", os.environ["STARKNET_TOKEN"]]
            if NETWORK == "alpha-mainnet"
            else []
        )
    )
    output = subprocess.run(cmd, capture_output=True)
    if output.returncode != 0:
        raise Exception(output.stderr.decode())
    address = re.search(
        r"contract address: (.*)", output.stdout.decode().lower()  # type: ignore
    )[1]
    transaction_hash = re.search(
        r"transaction hash: (.*)", output.stdout.decode().lower()  # type: ignore
    )[1]
    logger.info(f"{contract_name} deployed at: %s", address)
    return address, transaction_hash


def wait_for_transaction(transaction_hash, network=NETWORK):
    cmd = [
        "starknet",
        "tx_status",
        "--network",
        f"{network}",
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


def invoke(contract_name, function_name, *inputs, address=None, network=NETWORK):
    inputs_str = [str(i) for i in inputs]
    logger.info(f"Invoking {contract_name}.{function_name}({','.join(inputs_str)})")
    deployments = get_deployments(network)
    address = deployments[contract_name]["address"] if address is None else address
    cmd = [
        "starknet",
        "invoke",
        "--abi",
        get_abis(contract_name),
        "--network",
        f"{network}",
        "--address",
        f"{address}",
        "--function",
        function_name,
        "--account",
        "starksheet",
        "--wallet",
        "starkware.starknet.wallets.open_zeppelin.OpenZeppelinAccount",
    ] + ((["--inputs"] + inputs_str) if inputs else [])
    output = subprocess.run(cmd, capture_output=True)
    if output.returncode != 0:
        raise Exception(output.stderr.decode())
    transaction_hash = re.search(
        r"transaction hash: (.*)", output.stdout.decode().lower()  # type: ignore
    )[1]
    logger.info(f"{contract_name}.{function_name} invoked at tx: %s", transaction_hash)
    return transaction_hash


def call(contract_name, function_name, *inputs, address=None, network=NETWORK):
    inputs_str = [str(i) for i in inputs]
    logger.info(f"Calling {contract_name}.{function_name}({','.join(inputs_str)})")
    deployments = get_deployments(network)
    address = deployments[contract_name]["address"] if address is None else address
    cmd = [
        "starknet",
        "call",
        "--abi",
        get_abis(contract_name),
        "--network",
        f"{network}",
        "--address",
        f"{address}",
        "--function",
        function_name,
        "--no_wallet",
    ] + ((["--inputs"] + inputs_str) if inputs else [])
    output = subprocess.run(cmd, capture_output=True)
    if output.returncode != 0:
        raise Exception(output.stderr.decode())

    return output.stdout.decode().splitlines()  # type: ignore
