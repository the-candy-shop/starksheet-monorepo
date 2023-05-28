import functools
import json
import logging
import os
import re
import subprocess
from pathlib import Path
from typing import List, Optional, Union, cast

import requests
from caseconverter import snakecase
from dotenv import load_dotenv
from starknet_py.contract import Contract
from starknet_py.net.account.account import Account
from starknet_py.net.client import Client
from starknet_py.net.client_models import Call
from starknet_py.net.models import Address
from starknet_py.net.signer.stark_curve_signer import KeyPair
from starknet_py.proxy.contract_abi_resolver import ProxyConfig
from starknet_py.proxy.proxy_check import ProxyCheck
from starkware.starknet.core.os.contract_address.contract_address import (
    calculate_contract_address_from_hash,
)
from starkware.starknet.public.abi import get_selector_from_name

load_dotenv()

from utils.constants import (
    ACCOUNT_ADDRESS,
    BUILD_DIR,
    CHAIN_ID,
    CONTRACTS,
    DEPLOYMENTS_DIR,
    ETH_TOKEN_ADDRESS,
    GATEWAY_CLIENT,
    NETWORK,
    PRIVATE_KEY,
    STARKNET_NETWORK,
    STARKSCAN_URL,
)

logging.basicConfig()
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
account_verified = False


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
    env["STARKNET_NETWORK"] = STARKNET_NETWORK
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
            f"{GATEWAY_CLIENT.net}/gateway",
            "--feeder_gateway_url",
            f"{GATEWAY_CLIENT.net}/feeder_gateway",
        ],
        env=env,
        capture_output=True,
    )
    if output.returncode != 0:
        raise Exception(output.stderr.decode())
    transaction_hash = re.search(
        r"transaction hash: (.*)", (output.stdout.decode() + output.stderr.decode()).lower()  # type: ignore
    )[1]
    await GATEWAY_CLIENT.wait_for_tx(transaction_hash)


async def get_account(
    address=None,
    private_key=None,
) -> Account:
    global account_verified
    address = int(address or ACCOUNT_ADDRESS, 16)
    key_pair = KeyPair.from_private_key(int(private_key or PRIVATE_KEY, 16))

    if not account_verified:
        public_key = None
        for selector in ["get_public_key", "getPublicKey", "getSigner"]:
            try:
                call = Call(
                    to_addr=address,
                    selector=get_selector_from_name(selector),
                    calldata=[],
                )
                public_key = (
                    await GATEWAY_CLIENT.call_contract(call=call, block_hash="pending")
                )[0]
            except Exception as err:
                if (
                    json.loads(re.findall("{.*}", err.args[0], re.DOTALL)[0])["code"]
                    == "StarknetErrorCode.ENTRY_POINT_NOT_FOUND_IN_CONTRACT"
                ):
                    continue
                else:
                    raise err

        if key_pair.public_key != public_key:
            raise ValueError(
                f"Public key of account 0x{address:064x} is not consistent with provided private key"
            )

        account_verified = True

    return Account(
        address=address,
        client=GATEWAY_CLIENT,
        chain=CHAIN_ID,
        key_pair=key_pair,
    )


async def get_eth_contract() -> Contract:
    account = await get_account()

    class EthProxyCheck(ProxyCheck):
        """
        See https://github.com/software-mansion/starknet.py/issues/856
        """

        async def implementation_address(
            self, address: Address, client: Client
        ) -> Optional[int]:
            return await self.get_implementation(address, client)

        async def implementation_hash(
            self, address: Address, client: Client
        ) -> Optional[int]:
            return await self.get_implementation(address, client)

        @staticmethod
        async def get_implementation(address: Address, client: Client) -> Optional[int]:
            call = Call(
                to_addr=address,
                selector=get_selector_from_name("implementation"),
                calldata=[],
            )
            (implementation,) = await client.call_contract(call=call)
            return implementation

    proxy_config = (
        ProxyConfig(proxy_checks=[EthProxyCheck()]) if NETWORK != "devnet" else False
    )
    return await Contract.from_address(
        ETH_TOKEN_ADDRESS, account, proxy_config=proxy_config
    )


async def fund_address(address: Union[int, str], amount: float):
    """
    Fund a given starknet address with {amount} ETH
    """
    address = hex(address) if isinstance(address, int) else address
    amount = amount * 1e18
    if NETWORK == "devnet":
        response = requests.post(
            f"{GATEWAY_CLIENT.net}/mint", json={"address": address, "amount": amount}
        )
        if response.status_code != 200:
            logger.error(f"Cannot mint token to {address}: {response.text}")
        logger.info(f"{amount / 1e18} ETH minted to {address}")
    else:
        account = await get_account()
        eth_contract = await get_eth_contract()
        balance = (await eth_contract.functions["balanceOf"].call(account.address)).balance  # type: ignore
        if balance < amount:
            raise ValueError(
                f"Cannot send {amount / 1e18} ETH from default account with current balance {balance / 1e18} ETH"
            )
        tx = await eth_contract.functions["transfer"].invoke(
            address, int_to_uint256(amount), max_fee=int(1e16)
        )
        await tx.wait_for_acceptance()
        logger.info(
            f"{amount / 1e18} ETH sent from {hex(account.address)} to {address}"
        )


def dump_declarations(declarations):
    json.dump(
        {name: hex(class_hash) for name, class_hash in declarations.items()},
        open(DEPLOYMENTS_DIR / "declarations.json", "w"),
        indent=2,
    )


def get_declarations():
    return (
        {
            name: int(class_hash, 16)
            for name, class_hash in json.load(
                open(DEPLOYMENTS_DIR / "declarations.json")
            ).items()
        }
        if (DEPLOYMENTS_DIR / "declarations.json").is_file()
        else {}
    )


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
        open(DEPLOYMENTS_DIR / "deployments.json", "w"),
        indent=2,
    )


def get_deployments():
    def parse_hex_strings(obj):
        if "address" in obj:
            obj["address"] = int(obj["address"], 16)
        if "tx" in obj:
            obj["tx"] = int(obj["tx"], 16)
        return obj

    return (
        json.load(
            open(DEPLOYMENTS_DIR / "deployments.json"), object_hook=parse_hex_strings
        )
        if (DEPLOYMENTS_DIR / "deployments.json").is_file()
        else {}
    )


def get_artifact(contract_name):
    return BUILD_DIR / f"{contract_name}.json"


def get_alias(contract_name):
    return snakecase(contract_name)


def compile_contract(contract_name):
    contract_file = CONTRACTS.get(contract_name)
    if contract_file is None:
        raise ValueError(f"Cannot find src/**/{contract_name}.cairo in {os.getcwd()}")
    output = subprocess.run(
        [
            "starknet-compile-deprecated",
            contract_file,
            "--output",
            BUILD_DIR / f"{contract_name}.json",
            "--abi",
            BUILD_DIR / f"{contract_name}_abi.json",
            "--cairo_path",
            "./src",
            *(["--disable_hint_validation"] if NETWORK == "devnet" else []),
        ],
        capture_output=True,
    )
    if output.returncode != 0:
        raise RuntimeError(output.stderr)


async def declare(contract_name):
    logger.info(f"ℹ️  Declaring {contract_name}")
    account = await get_account()
    artifact = get_artifact(contract_name)
    declare_transaction = await account.sign_declare_transaction(
        compiled_contract=Path(artifact).read_text(), max_fee=int(1e16)
    )
    resp = await account.client.declare(transaction=declare_transaction)
    logger.info(f"⏳ Waiting for tx {get_tx_url(resp.transaction_hash)}")
    await account.client.wait_for_tx(resp.transaction_hash)
    logger.info(f"✅ {contract_name} class hash: {hex(resp.class_hash)}")
    return resp.class_hash


async def deploy(contract_name, *args):
    logger.info(f"ℹ️  Deploying {contract_name}")
    account = await get_account()
    abi = json.loads(Path(get_abi(contract_name)).read_text())

    deploy_result = await Contract.deploy_contract(
        account=account,
        class_hash=get_declarations()[contract_name],
        abi=abi,
        constructor_args=list(args),
        max_fee=int(1e16),
    )
    logger.info(f"⏳ Waiting for tx {get_tx_url(deploy_result.hash)}")
    await deploy_result.wait_for_acceptance()
    logger.info(
        f"✅ {contract_name} deployed at: {hex(deploy_result.deployed_contract.address)}"
    )
    return deploy_result.deployed_contract.address, deploy_result.hash


async def invoke_address(contract_address, function_name, *calldata, account=None):
    account = account or (await get_account())
    logger.info(
        f"ℹ️  Invoking {function_name}({json.dumps(calldata) if calldata else ''}) "
        f"at address {hex(contract_address)[:10]}"
    )
    return await account.execute(
        Call(
            to_addr=contract_address,
            selector=get_selector_from_name(function_name),
            calldata=cast(List[int], calldata),
        ),
        max_fee=int(1e16),
    )


async def invoke_contract(
    contract_name, function_name, *inputs, address=None, account=None
):
    account = account or (await get_account())
    deployments = get_deployments()
    contract = Contract(
        deployments[contract_name]["address"] if address is None else address,
        json.load(open(get_artifact(contract_name)))["abi"],
        account,
    )
    call = contract.functions[function_name].prepare(*inputs, max_fee=int(1e16))
    logger.info(
        f"ℹ️  Invoking {contract_name}.{function_name}({json.dumps(inputs) if inputs else ''})"
    )
    return await account.execute(call, max_fee=int(1e16))


async def invoke(contract, *args, **kwargs):
    response = await (
        invoke_address(contract, *args, **kwargs)
        if isinstance(contract, int)
        else invoke_contract(contract, *args, **kwargs)
    )
    logger.info(f"⏳ Waiting for tx {get_tx_url(response.transaction_hash)}")
    status = (await GATEWAY_CLIENT.wait_for_tx(response.transaction_hash))[1].name
    logger.info(f"✅ Status: {status}")


async def call_address(contract_address, function_name, *calldata):
    account = await get_account()
    return await account.client.call_contract(
        Call(
            to_addr=contract_address,
            selector=get_selector_from_name(function_name),
            calldata=cast(List[int], calldata),
        )
    )


async def call_contract(contract_name, function_name, *inputs, address=None):
    deployments = get_deployments()
    account = await get_account()
    contract = Contract(
        deployments[contract_name]["address"] if address is None else address,
        json.load(open(get_artifact(contract_name)))["abi"],
        account,
    )
    return await contract.functions[function_name].call(*inputs)


async def call(contract, *args, **kwargs):
    return await (
        call_address(contract, *args, **kwargs)
        if isinstance(contract, int)
        else call_contract(contract, *args, **kwargs)
    )


@functools.wraps(GATEWAY_CLIENT.wait_for_tx)
async def wait_for_transaction(*args, **kwargs):
    return await GATEWAY_CLIENT.wait_for_tx(*args, **kwargs)


def get_tx_url(tx_hash: int) -> str:
    return f"{STARKSCAN_URL}/tx/0x{tx_hash:064x}"


def get_abi(contract_name):
    return BUILD_DIR / f"{contract_name}_abi.json"


async def compute_sheet_address(name, symbol):
    renderer_address = (
        await call("Starksheet", "getSheetDefaultRendererAddress")
    ).address
    sheet_class_hash = (await call("Starksheet", "getSheetClassHash")).hash
    proxy_class_hash = (await call("Starksheet", "getProxyClassHash")).hash
    owner = await get_account()
    deployments = get_deployments()
    calldata = {
        "proxyAdmin": owner.address,
        "implementation": sheet_class_hash,
        "selector": get_selector_from_name("initialize"),
        "calldataLen": 6,
        "name": int(name.encode().hex(), 16),
        "symbol": int(symbol.encode().hex(), 16),
        "owner": owner.address,
        "merkleRoot": 0,
        "maxPerWallet": 0,
        "rendererAddress": renderer_address,
    }
    return calculate_contract_address_from_hash(
        owner.address,
        proxy_class_hash,
        list(calldata.values()),
        deployments["Starksheet"]["address"],
    )
