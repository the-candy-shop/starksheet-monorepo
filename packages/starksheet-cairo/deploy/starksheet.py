import json
import logging

from nile.nre import NileRuntimeEnvironment

from constants import ALLOW_LIST, OWNER
from utils import address_to_leaf, deploy, merkle_proofs, merkle_root

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


def run(nre: NileRuntimeEnvironment) -> None:
    deploy(
        nre,
        "Starksheet",
        [
            "0x" + "Starksheet".encode().hex(),
            "0x" + "STRK".encode().hex(),
            hex(OWNER),
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
