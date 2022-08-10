import json
import logging

import pandas as pd
import typer
from starkware.starknet.public.abi import get_selector_from_name

from constants import NETWORK, OWNER
from deploy.cli import (
    declare,
    deploy,
    get_alias,
    get_artifact,
    invoke,
    wait_for_transaction,
)

logging.basicConfig()
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


def main():
    class_hash = {
        contract_name: declare(contract_name)
        for contract_name in ["Sheet", "Starksheet", "BasicCellRenderer", "math"]
    }
    json.dump(class_hash, open(f"{NETWORK}.declarations.json", "w"), indent=2)
    json.dump(
        {
            func["name"]: str(get_selector_from_name(func["name"]))
            for func in json.load(open("artifacts/math.json"))["abi"]
        },
        open("selectors.json", "w"),
        indent=2,
    )

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

    json.dump(deployments, open(f"{NETWORK}.deployments.json", "w"), indent=2)
    pd.DataFrame(list(deployments.values())).to_csv(
        f"{NETWORK}.deployments.txt", index=False, sep=":", header=False
    )

    # invoke(network, "Starksheet", "setMerkleRoot", 0, 0, 0)
    wait_for_transaction(deployments["Starksheet"]["tx"])
    name = int("Origin".encode().hex(), 16)
    symbol = int("ORGS".encode().hex(), 16)
    proof = []
    tx = invoke("Starksheet", "addSheet", name, symbol, len(proof), *proof)
    wait_for_transaction(tx)


if __name__ == "__main__":
    typer.run(main)
