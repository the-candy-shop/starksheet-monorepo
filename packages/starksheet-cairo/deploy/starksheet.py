import logging
from asyncio import run

from dotenv import load_dotenv

from deploy.utils import (
    compile_contract,
    declare,
    deploy,
    dump_declarations,
    dump_deployments,
    get_account,
    get_alias,
    get_artifact,
    get_declarations,
    get_eth_contract,
    get_tx_url,
    invoke,
    wait_for_transaction,
)

load_dotenv()
logging.basicConfig()
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


async def main():
    class_hash = {}
    for contract_name in [
        "Sheet",
        "Starksheet",
        "BasicCellRenderer",
        "math",
        "execute",
    ]:
        compile_contract(contract_name)
        class_hash[contract_name] = await declare(contract_name)
    dump_declarations(class_hash)
    class_hash = get_declarations()

    deployments = {
        contract_name: {
            **dict(zip(["address", "tx"], await deploy(contract_name))),
            "artifact": get_artifact(contract_name),
            "alias": get_alias(contract_name),
        }
        for contract_name in ["BasicCellRenderer", "math", "execute"]
    }
    deployments["Starksheet"] = {
        **dict(
            zip(
                ["address", "tx"],
                await deploy(
                    "Starksheet",
                    (await get_account()).address,
                    class_hash["Sheet"],
                    deployments["BasicCellRenderer"]["address"],
                    int(0.01 * 1e18),
                ),
            )
        ),
        "artifact": get_artifact("Starksheet"),
        "alias": get_alias("Starksheet"),
    }
    dump_deployments(deployments)

    # Add a first sheet
    name = "Origin"
    symbol = "ORGS"
    proof = []
    eth_contract = await get_eth_contract()

    tx_hash = (
        await eth_contract.functions["approve"].invoke(
            deployments["Starksheet"]["address"],
            int(0.01 * 1e18),
            max_fee=int(1e16),
        )
    ).hash
    logger.info(f"⏳ Approving starksheet")
    logger.info(f"⏳ Waiting for tx {get_tx_url(tx_hash)}")
    await wait_for_transaction(tx_hash)
    await invoke("Starksheet", "addSheet", name, symbol, proof)


if __name__ == "__main__":
    run(main())
