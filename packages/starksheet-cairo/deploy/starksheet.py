import logging
from asyncio import run

import pandas as pd
from dotenv import load_dotenv

from constants import OWNER
from deploy.cli import (
    declare,
    deploy,
    dump_declarations,
    dump_deployments,
    get_alias,
    get_artifact,
    invoke,
    wait_for_transaction,
)

load_dotenv()
logging.basicConfig()
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


async def main():
    class_hash = {
        contract_name: declare(contract_name)
        for contract_name in ["Sheet", "Starksheet", "BasicCellRenderer", "math"]
    }
    dump_declarations(class_hash)

    deployments = {
        contract_name: {
            **dict(zip(["address", "tx"], deploy(contract_name))),
            "artifact": get_artifact(contract_name),
            "alias": get_alias(contract_name),
        }
        for contract_name in ["BasicCellRenderer", "math"]
    }
    deployments["Starksheet"] = {
        **dict(
            zip(
                ["address", "tx"],
                deploy(
                    "Starksheet",
                    hex(OWNER),
                    class_hash["Sheet"],
                    deployments["BasicCellRenderer"]["address"],
                ),
            )
        ),
        "artifact": get_artifact("Starksheet"),
        "alias": get_alias("Starksheet"),
    }
    dump_deployments(deployments)
    wait_for_transaction(deployments["Starksheet"]["tx"])

    # Add a first sheet
    name = int("Origin".encode().hex(), 16)
    symbol = int("ORGS".encode().hex(), 16)
    proof = []
    tx = await invoke("Starksheet", "addSheet", name, symbol, proof)
    wait_for_transaction(tx)


if __name__ == "__main__":
    run(main())
