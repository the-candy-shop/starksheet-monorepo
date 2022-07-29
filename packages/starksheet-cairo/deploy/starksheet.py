import json
import logging
import re
import subprocess

from nile.nre import NileRuntimeEnvironment

from constants import ALLOW_LIST, OWNER
from utils import address_to_leaf, deploy, merkle_proofs, merkle_root

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


def run(nre: NileRuntimeEnvironment) -> None:
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

    renderer_address, _ = deploy(
        nre,
        "BasicCellRenderer",
        [],
    )

    deploy(
        nre,
        "Starksheet",
        [
            hex(OWNER),
            sheet_class_hash,
            renderer_address,
        ],
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
