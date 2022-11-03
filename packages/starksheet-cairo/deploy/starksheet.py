import logging
from asyncio import run

from dotenv import load_dotenv

from constants import OWNER
from deploy.cli import (
    compile_contract,
    declare,
    deploy,
    dump_declarations,
    dump_deployments,
    fund_address,
    get_alias,
    get_artifact,
    invoke,
    network,
    wait_for_transaction,
)

load_dotenv()
logging.basicConfig()
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


async def main():
    class_hash = {}
    for contract_name in ["Sheet", "Starksheet", "BasicCellRenderer", "math"]:
        compile_contract(contract_name)
        class_hash[contract_name] = await declare(contract_name)
    dump_declarations(class_hash)

    deployments = {
        contract_name: {
            **dict(zip(["address", "tx"], await deploy(contract_name))),
            "artifact": get_artifact(contract_name),
            "alias": get_alias(contract_name),
        }
        for contract_name in ["BasicCellRenderer", "math"]
    }
    deployments["Starksheet"] = {
        **dict(
            zip(
                ["address", "tx"],
                await deploy(
                    "Starksheet",
                    OWNER,
                    class_hash["Sheet"],
                    deployments["BasicCellRenderer"]["address"],
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
    tx = await invoke("Starksheet", "addSheet", name, symbol, proof)
    await wait_for_transaction(tx)

    if network == "devnet":
        await fund_address(
            "0x01C8d2Bb17cdDf22728553c9700ADfBBD42D1999194b409B1188b17191Cc2Efd", 1
        )


if __name__ == "__main__":
    run(main())
