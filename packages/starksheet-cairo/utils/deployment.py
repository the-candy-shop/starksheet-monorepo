import functools
import json
import logging
import os
import subprocess
import time
from pathlib import Path
from typing import List, Optional, Union, cast

import requests
from caseconverter import snakecase
from dotenv import load_dotenv
from starknet_py.contract import Contract
from starknet_py.net.account.account import Account
from starknet_py.net.client import Client
from starknet_py.net.client_models import Call, TransactionStatus
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
    NETWORK,
    PRIVATE_KEY,
    RPC_CLIENT,
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
                    await RPC_CLIENT.call_contract(call=call, block_hash="latest")
                )[0]
            except Exception as err:
                if (
                    err.message == "Client failed with code 40: Contract error."
                    or err.message
                    == "Client failed with code 21: Invalid message selector."
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
        client=RPC_CLIENT,
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
            f"http://127.0.0.1:5050/mint", json={"address": address, "amount": amount}
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
        await wait_for_transaction(tx.hash)
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
    await wait_for_transaction(resp.transaction_hash)
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
    await wait_for_transaction(deploy_result.hash)
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
    await wait_for_transaction(response.transaction_hash)


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


# TODO: use RPC_CLIENT when RPC wait_for_tx is fixed, see https://github.com/kkrt-labs/kakarot/issues/586
@functools.wraps(RPC_CLIENT.wait_for_tx)
async def wait_for_transaction(*args, **kwargs):
    check_interval = kwargs.get("check_interval", 15 if NETWORK != "devnet" else 2)
    transaction_hash = args[0] if args else kwargs["tx_hash"]
    status = TransactionStatus.NOT_RECEIVED
    while status not in [TransactionStatus.ACCEPTED_ON_L2, TransactionStatus.REJECTED]:
        logger.info(f"ℹ️  Sleeping for {check_interval}s")
        time.sleep(check_interval)
        response = requests.post(
            RPC_CLIENT.url,
            json={
                "jsonrpc": "2.0",
                "method": f"starknet_getTransactionReceipt",
                "params": {"transaction_hash": hex(transaction_hash)},
                "id": 0,
            },
        )
        status = json.loads(response.text).get("result", {}).get("status")
        if status is not None:
            status = TransactionStatus(status)
            logger.info(f"ℹ️  Current status: {status.value}")


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
