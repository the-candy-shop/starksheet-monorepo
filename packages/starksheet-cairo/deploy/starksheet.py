import json
import logging
import re
import subprocess

import pandas as pd
from starkware.starknet.public.abi import get_selector_from_name

from constants import ALLOW_LIST, OWNER
from utils import address_to_leaf, merkle_proofs, merkle_root

logging.basicConfig()
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


def main():
    logger.info("Declaring Sheet")
    output = subprocess.run(
        [
            "starknet",
            "declare",
            "--contract",
            "artifacts/Sheet.json",
            "--network",
            "alpha-goerli",
        ],
        capture_output=True,
    )
    sheet_class_hash = re.search(
        r"contract class hash: (.*)", output.stdout.splitlines()[1].decode().lower()  # type: ignore
    )[1]
    logger.info("Sheet declared with class hash: %s", sheet_class_hash)

    logger.info("Deploying BasicCellRenderer")
    output = subprocess.run(
        [
            "starknet",
            "deploy",
            "--contract",
            "artifacts/BasicCellRenderer.json",
            "--network",
            "alpha-goerli",
            "--no_wallet",
        ],
        capture_output=True,
    )
    renderer_address = re.search(
        r"contract address: (.*)", output.stdout.splitlines()[1].decode().lower()  # type: ignore
    )[1]
    logger.info("BasicCellRenderer deployed at: %s", renderer_address)

    logger.info("Deploying Starksheet")
    output = subprocess.run(
        [
            "starknet",
            "deploy",
            "--contract",
            "artifacts/Starksheet.json",
            "--network",
            "alpha-goerli",
            "--no_wallet",
            "--inputs",
        ]
        + [
            hex(OWNER),
            sheet_class_hash,
            renderer_address,
        ],
        capture_output=True,
    )
    starksheet_address = re.search(
        r"contract address: (.*)", output.stdout.splitlines()[1].decode().lower()  # type: ignore
    )[1]
    logger.info("Starksheet deployed at: %s", starksheet_address)

    logger.info("Deploying math")
    output = subprocess.run(
        [
            "starknet",
            "deploy",
            "--contract",
            "artifacts/math.json",
            "--network",
            "alpha-goerli",
            "--no_wallet",
        ],
        capture_output=True,
    )
    math_address = re.search(
        r"contract address: (.*)", output.stdout.splitlines()[1].decode().lower()  # type: ignore
    )[1]
    logger.info("math deployed at: %s", math_address)

    pd.DataFrame(
        {
            "address": [renderer_address, starksheet_address, math_address],
            "artifact": [
                "artifacts/BasicCellRenderer.json",
                "artifacts/Starksheet.json",
                "artifacts/math.json",
            ],
            "alias": ["basic_cell_renderer", "starksheet", "math"],
        }
    ).to_csv("goerli.deployments.txt", index=False, sep=":", header=False)

    json.dump(
        {
            func["name"]: str(get_selector_from_name(func["name"]))
            for func in json.load(open("artifacts/math.json"))["abi"]
        },
        open("selectors.json", "w"),
        indent=2,
    )

    json.dump(
        {
            hex(address): [str(p) for p in proof]
            for address, proof in merkle_proofs(ALLOW_LIST).items()
        },
        open("allow_list.json", "w"),
        indent=2,
    )

    leafs = [address_to_leaf(address) for address in ALLOW_LIST]
    root = merkle_root(leafs)
    logger.info(f"Allow list merkle root: {root}")


if __name__ == "__main__":
    main()
    logger.info("Done")
    exit(0)
