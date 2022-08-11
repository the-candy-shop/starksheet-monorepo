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
    typer.echo("Computing Merkle proofs...")
    json.dump(
        {
            hex(address): [str(p) for p in proof]
            for address, proof in merkle_proofs(ALLOW_LIST).items()
        },
        open("allow_list.json", "w"),
        indent=2,
    )

    typer.echo("Computing Merkle root...")
    leafs = [address_to_leaf(address) for address in ALLOW_LIST]
    root = merkle_root(leafs)
    typer.echo(f"Merkle root: {root}")

    sheet = call("Starksheet", "getSheet", 0)[0]
    set_root_tx = invoke("Sheet", "setMerkleRoot", root, address=sheet)
    max_per_wallet = int(call("Sheet", "getMaxPerWallet", address=sheet)[0])
    typer.echo(f"Current max per wallet: {max_per_wallet}")
    if max_per_wallet != 10:
        typer.echo(f"Setting max per wallet to 10")
        set_max_wallet_tx = invoke("Sheet", "setMaxPerWallet", 10, address=sheet)
        wait_for_transaction(set_max_wallet_tx)
    wait_for_transaction(set_root_tx)
    logger.info(f"Sheet {sheet} ready to be used!")


if __name__ == "__main__":
    typer.run(main)
