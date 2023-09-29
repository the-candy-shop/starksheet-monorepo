import logging
import random

from dotenv import load_dotenv
from starknet_py.hash.address import compute_address
from starknet_py.net.account.account import Account
from starknet_py.net.client_models import TransactionStatus
from starknet_py.net.signer.stark_curve_signer import KeyPair
from starkware.starknet.core.os.contract_address.contract_address import (
    calculate_contract_address_from_hash,
)
from starkware.starknet.public.abi import get_selector_from_name

load_dotenv()

from utils.constants import NETWORK, RPC_CLIENT
from utils.starknet import (
    call,
    compile_contract,
    declare,
    fund_address,
    get_deployments,
    get_starknet_account,
    wait_for_transaction,
)

logging.basicConfig()
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


async def compute_sheet_address(name, symbol):
    renderer_address = (
        await call("Starksheet", "getSheetDefaultRendererAddress")
    ).address
    sheet_class_hash = (await call("Starksheet", "getSheetClassHash")).hash
    proxy_class_hash = (await call("Starksheet", "getProxyClassHash")).hash
    owner = await get_starknet_account()
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


async def deploy_starknet_account(private_key=None, amount=1) -> Account:
    compile_contract(
        {"contract_name": "OpenzeppelinAccount", "is_account_contract": True}
    )
    class_hash = await declare("OpenzeppelinAccount")
    salt = random.randint(0, 2**251)
    private_key = private_key or NETWORK["private_key"]
    if private_key is None:
        raise ValueError(
            "private_key was not given in arg nor in env variable, see README.md#Deploy"
        )
    key_pair = KeyPair.from_private_key(int(private_key, 16))
    constructor_calldata = [key_pair.public_key]
    address = compute_address(
        salt=salt,
        class_hash=class_hash,
        constructor_calldata=constructor_calldata,
        deployer_address=0,
    )
    logger.info(f"ℹ️  Funding account {hex(address)} with {amount} ETH")
    await fund_address(address, amount=amount)
    logger.info("ℹ️  Deploying account"unt")
    res = await Account.deploy_account(
        address=address,
        class_hash=class_hash,
        salt=salt,
        key_pair=key_pair,
        client=RPC_CLIENT,
        chain=NETWORK["chain_id"],
        constructor_calldata=constructor_calldata,
        max_fee=int(1e17),
    )
    status = await wait_for_transaction(res.hash)
    if status == TransactionStatus.REJECTED:
        logger.warning("⚠️  Transaction REJECTED")

    logger.info(f"✅ Account deployed at address {hex(res.account.address)}")
    NETWORK["account_address"] = hex(res.account.address)
    NETWORK["private_key"] = hex(key_pair.private_key)
    return res.account
