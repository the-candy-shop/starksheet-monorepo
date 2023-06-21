# %% Imports
import logging
from asyncio import run
from datetime import datetime

from dotenv import load_dotenv
from utils.constants import COMPILED_CONTRACTS, NETWORK
from utils.deployment import (
    compile_contract,
    declare,
    deploy,
    deploy_starknet_account,
    dump_declarations,
    dump_deployments,
    get_account,
    get_alias,
    get_artifact,
    get_declarations,
    get_deployments,
)

load_dotenv()
logging.basicConfig()
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


# %% Main
async def main():
    # %% Compile
    logger.info(f"ℹ️  Compiling contracts for network {NETWORK['name']}")
    initial_time = datetime.now()
    for contract in COMPILED_CONTRACTS:
        logger.info(f"⏳ Compiling {contract}")
        start = datetime.now()
        compile_contract(contract)
        elapsed = datetime.now() - start
        logger.info(f"✅ Compiled in {elapsed.total_seconds():.2f}s")

    logger.info(
        f"✅ Compiled all in {(datetime.now() - initial_time).total_seconds():.2f}s"
    )

    # %% Declarations
    if NETWORK["name"] in ["madara", "sharingan"]:
        await deploy_starknet_account(amount=100)
    account = await get_account()
    logger.info(f"ℹ️  Using account {hex(account.address)} as deployer")

    class_hash = {
        contract["contract_name"]: await declare(contract["contract_name"])
        for contract in COMPILED_CONTRACTS
    }
    dump_declarations(class_hash)

    # %% Deploy contracts
    class_hash = get_declarations()
    deployments = get_deployments()
    deployments = {
        contract_name: {
            **dict(zip(["address", "tx"], await deploy(contract_name))),
            "artifact": get_artifact(contract_name),
            "alias": get_alias(contract_name),
        }
        for contract_name in [
            "BasicCellRenderer",
            "math",
            "execute",
        ]
    }
    deployments["Starksheet"] = {
        **dict(
            zip(
                ["address", "tx"],
                await deploy(
                    "Starksheet",
                    (await get_account()).address,  # owner
                    class_hash["Sheet"],  # sheet_class_hash
                    class_hash["proxy"],  # proxy_class_hash
                    deployments["BasicCellRenderer"][
                        "address"
                    ],  # default_renderer_address
                    int(0.01 * 1e18),  # sheet_price
                ),
            )
        ),
        "artifact": get_artifact("Starksheet"),
        "alias": get_alias("Starksheet"),
    }
    dump_deployments(deployments)


# %% Main
if __name__ == "__main__":
    run(main())
