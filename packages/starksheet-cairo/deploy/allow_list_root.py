import json
import logging

import typer

from constants import ALLOW_LIST
from deploy.cli import call, invoke, wait_for_transaction
from utils import address_to_leaf, merkle_proofs, merkle_root

logging.basicConfig()
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


def main():
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
    sheet = call("Starksheet", "getSheet", 0)[0]
    tx = invoke("Sheet", "setMerkleRoot", root, address=sheet)
    wait_for_transaction(tx)
    logger.info(f"Sheet {sheet} ready to be used!")


if __name__ == "__main__":
    typer.run(main)
